const API_URL_HOST = "http://52.221.86.148/api/ideation/concepts";
// const API_URL_HOST = "http://localhost:5000";
var userid;

var allKeywords = [] ;
var selectedKeywords = [];
var searchIterations = [];
var curentKeywords = [];
var iterationCount = 0;
var displayedIteration = 0;
var previousKeywords = [];
var previousSearchKeywords = [];
var matrixJSON = {};
var nodes_current = {};
var node_id = 0;
var graphMode = 0;
var num_neighs = 20;
var search_conns = 0;
var num_clicks = 10;
var colorFlag = 0;
var treeDepth = 3;
var graphStartMode = 0;
var deletedNodes = [];
userid = Math.floor(Math.random() * 1000000) + 1000000; // returns a random integer from 1 to 100
$('#user_id_field').html(userid.toString());


function initialize(){
	console.log('initalize');

	$("#d3ADJ").hide();

	// userid = Math.floor(Math.random() * 1000000) + 1000000; // returns a random integer from 1 to 100



	// var initializeModal = document.getElementById('initializeModal');
	$("#initializeModal").modal({
      backdrop: "static", //remove ability to close modal with click
      keyboard: false, //remove option to close with keyboard
      show: false //Display loader!
    });

	$.ajax({
			url: API_URL_HOST + '/initializeTKG',
			type: "POST",
			contentType: 'application/json',
			dataType: 'json',
			async: true,
			data: JSON.stringify({ "userid": userid, "start":1}),
			success: function(response) {
				console.log(response)
				if (response['message'] == 'success'){
					setTimeout(function() {$("#initializeModal").modal("hide");}, 500);


				}
				}
		});

}
function toSection3(){
	javascript:location.href='#section3';
	// $('#section2').hide();
}

function toSection2(){
	javascript:location.href='#section2';
	// $('#section1').hide();
}


$("#GraphMode_switch").change(function(){
    if($(this).prop("checked") == true){
       graphMode = 1;
    }else{
       graphMode = 0;
    }
});

function countChar() {
    var len = $("#para").val().length;
    $('#charCount').text(1000 - len);
 }
function countChar1() {
    var len = $("#wordGraph_Input").val().length;
    $('#charCount1').text(1000 - len);
 }


function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function arraysEqual(a1,a2) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1)==JSON.stringify(a2);
}

function writeLog(statement){
	//statement should be a dictionary
	$.ajax({
			url: API_URL_HOST + '/writeToLog',
			type: "POST",
			contentType: 'application/json',
			dataType: 'json',
			async: true,
			data: JSON.stringify({"userid":userid, "statement": statement}),
			success: function(response) {
				// console.log(response);
				if (response == '1'){
					console.log('write success');
				}
			}
	});

}

function word2word_similarity (){
	word1 = $("#word1").val();
	if (word1.charAt(word1.length-1) == ' ' || word1.charAt(word1.length-1) == '\n'){
		word1 = word1.substring(0, word1.length-1);
	}
	word2 = $("#word2").val();
	if (word2.charAt(word2.length-1) == ' ' || word2.charAt(word2.length-1) == '\n'){
		word2 = word2.substring(0, word2.length-1);
	}
	word1 = word1.toLowerCase();
	word2 = word2.toLowerCase();
	url_sim = API_URL_HOST+'/similarity?key1='+word1+'&key2='+word2;
	// console.log(url_sim);
	$.get(url_sim, function(data){
		console.log(data);
		var sim = parseFloat(data['similarity'])
		sim = sim.toFixed(3);
		if (sim.toString() == 'NaN'){
			console.log('error')
			$('#w2wResult').val('Error: '+data['error']);

		}
		else{
			$('#w2wResult').val('Relevance: '+sim.toString());
			var timestamp = Date.now();
			writeLog('t2t'+'\t'+timestamp.toString()+'\t'+word1+'\t'+word2+'\n');
		}

	});
}

function calculateZScore(num, mu, sigma){
	return (num-mu)/sigma;
}

function getMeanSigma(array){
	var len = array.length;
	var new_arr = []
	for(var i =0; i<len; i++){
		for (var j=i+1; j<len; j++){
			new_arr.push (array[i][j])
		}
	}
	var mean = new_arr.reduce(function (a, b){
		return Number(a) + Number(b);})/new_arr.length;

	var std = Math.sqrt(new_arr.reduce(function (sq, n) {
            return sq + Math.pow(n - mean, 2);
        }, 0) / (new_arr.length - 1));

	return [mean, std];
}

function getMin(array){
	var new_arr = [];
	var len = array.length;
	for(var i =0; i<len; i++){
		for (var j=i+1; j<len; j++){
			new_arr.push (parseFloat(array[i][j]));
		}
	}
	return Math.min.apply(Math,new_arr);
}

function getAdjacency(){
	var text = $("#para").val();
	if (text.length == 0){
		alert('Empty paragraph field!');
		return (0)
	}
	$.ajax({
			url: API_URL_HOST + '/para2adj',
			type: "POST",
			contentType: 'application/json',
			dataType: 'json',
			async: true,
			data: JSON.stringify({"userid":userid, "paragraph": text}),
			success: function(response) {
				// console.log(response);
				var adj= [];
				var towrite = [];
				adj = response['adjacency'];
				// var ms = getMeanSigma(adj);
				// console.log(ms);
				// var mean = ms[0];
				// var sigma = ms[1];
				minv = getMin(adj);

				var keys = response['keywords'];
				var partition = response['partition'];
				var index = new Array(keys.length);
				for (var i = 0; i<index.length; i++){
					index[i] = i.toString();
				}
				var firstLine = ['', ''];
				towrite.push(firstLine.concat(index));
				for (var i = 0; i<index.length; i++){
					var line = [index[i], keys[i]];
					towrite.push(line.concat(adj[i]));
				}
				var nodes = [];
				// var node_data = [];
				for (var i = 0; i<keys.length; i++){
					var node_var = [{"name":keys[i], "group":5, "partition":partition[i]}];
					nodes = nodes.concat(node_var);
					// node_data = node_data.concat([keys[i]]);
				}
				var links = []
				var edges = []
				for (var i = 0; i<adj.length; i++){
					for (var j = i+1; j<adj.length; j++){
						var link_var =
						[{"source":j, "target":i, "value":(adj[i][j]-minv)/(1-minv)}];
						links = links.concat(link_var);
						var edge_var =
						[{"source":j, "target":i, "weight":(adj[i][j]-minv)/(1-minv)}];
						edges = edges.concat(edge_var);
					}
				}
				// console.log(nodes);
				// console.log(links);
				// var community = jLouvain().nodes(node_data).edges(edges);
    // 			var result  = community();
    // 			console.log(result);
    // 			var nodes = [];
    // 			Object.keys(result).forEach(function(key) {
    // 				nodes = nodes.concat([{"name":key, "group":result[key]}]);
				// });
				// console.log(nodes);

				matrixJSON = {"nodes":nodes, "links":links};
				$('#d3ADJ').show();
				d3matrix(matrixJSON);
				createCSV(towrite);
				var timestamp = Date.now();
				writeLog('p2r'+'\t'+timestamp.toString()+'\t'+text+'\n');
				}
	});

}

function getGraph(){
	var word = $("#wordTree_Input").val();
	if (word.charAt(word.length-1) == ' ' || word.charAt(word.length-1) == '\n'){
		word = word.substring(0, word.length-1);
	}
	var loadingModal = document.getElementById('loadingModal');
	if (word.length == 0){
		alert('No input!');
		return (0)
	}
	word = word.replace(' ', '_');
	word = word.toLowerCase();
	$("#loadingModal").modal({
		      backdrop: "static", //remove ability to close modal with click
		      keyboard: false, //remove option to close with keyboard
		      show: true //Display loader!
		    });
	$.ajax({
			url: API_URL_HOST + '/getTree',
			type: "POST",
			contentType: 'application/json',
			dataType: 'json',
			async: true,
			data: JSON.stringify({"userid":userid, "word": word}),
			success: function(response) {
				console.log(response);
				if (response['error']!=null){
					alert('Error!');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0);
				}
				treeGraph(response);
				setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
				var timestamp = Date.now();
				writeLog('t2tree'+'\t'+timestamp.toString()+'\t'+word+'\n');
				},
			error: function() {
					alert('Error!');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0);
				}
	});

}

function getNode(){
	var word = $("#wordGraph_Input").val();
	if (word.charAt(word.length-1) == ' ' || word.charAt(word.length-1) == '\n'){
		word = word.substring(0, word.length-1);
	}
	var loadingModal = document.getElementById('loadingModal');
	if (word.length == 0){
		alert('No input!');
		return (0)
	}
	word = word.replace(' ', '_');
	word = word.toLowerCase();
	if (word in nodes_current){
		alert ('The term is already in graph');
		return (0)
	}
	$("#loadingModal").modal({
		      backdrop: "static", //remove ability to close modal with click
		      keyboard: false, //remove option to close with keyboard
		      show: true //Display loader!
	});
	$.ajax({
			url: API_URL_HOST + '/topn',
			type: "POST",
			contentType: 'application/json',
			dataType: 'json',
			async: true,
			data: JSON.stringify({"userid":userid, "word": word}),
			success: function(response) {
				console.log(response);

				if (response['error']!=null){
					alert ('Error: The term cannot be found in TKG');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0)
				}

				if (response['top20'][0] == 0){
					alert ('Error: The term cannot be found in TKG');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0)
				}


				top20 = response['top20'];
				var timestamp = Date.now();
				writeLog('t2G\t'+timestamp.toString()+'\t'+'search\t'+word+'\n');
				if (isEmpty(nodes_current)){
					console.log('empty');
					let nodes = [{id:node_id, name:response['word']}];
					nodes_current[response['word']] = {"id":node_id, "sims":top20, "clicks":0};
					node_id+=1
					let links = [];
					graph1.add(nodes, links);

				}
				else{
					if (!(word in nodes_current)){
						console.log('not empt');
						let nodes = [{id:node_id, name:response['word']}];
						nodes_current[response['word']] = {"id":node_id, "sims":top20, "clicks":0};
						let links = [];
						console.log(node_id);
						links = findOtherLinks(response['word'], node_id, links, null);
						node_id+=1;
						graph1.add(nodes, links);

					}
				}
				// addNode(response['word']);
				// nodes_current[response['word']] = top20;
				setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
			},
			error: function() {
					alert('error');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
			}
	});

}

function newTreeGraph (){
	var word = $("#wordGraph_Input").val();
	if (word.charAt(word.length-1) == ' ' || word.charAt(word.length-1) == '\n'){
		word = word.substring(0, word.length-1);
	}
	var loadingModal = document.getElementById('loadingModal');
	if (word.length == 0){
		alert('No input!');
		return (0);
	}
	word = word.replace(' ', '_');
	word = word.toLowerCase();
	if (word in nodes_current){
		alert ('The term is already in graph');
		return (0)
	}
	$("#loadingModal").modal({
		      backdrop: "static", //remove ability to close modal with click
		      keyboard: false, //remove option to close with keyboard
		      show: true //Display loader!
	});

	resetGraph();

	$.ajax({
			url: API_URL_HOST + '/getGraph',
			type: "POST",
			contentType: 'application/json',
			dataType: 'json',
			async: true,
			data: JSON.stringify({"userid":userid, "word": word}),
			success: function(response) {
				// console.log(response);
				if (response['error']!=null){
					alert('Error!');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0);
				}
				var Graph_data = response['graph_data'];
				if (response['mode'] == 0){
					graphStartMode = 0;
					var nodes = [];
					var node_names = [];
					for (var i = 0; i<Graph_data['nodes'].length; i++){
						nodes.push({id:Graph_data['nodes'][i]['index'], name:Graph_data['nodes'][i]['name']});
						if (Graph_data['nodes'][i]['group']<treeDepth){
							nodes_current[Graph_data['nodes'][i]['name']] = {"id":Graph_data['nodes'][i]['index'], "sims":Graph_data['nodes'][i]['neighbors'], "clicks":3};
							node_names.push(Graph_data['nodes'][i]['name']);
						}
						else{
							nodes_current[Graph_data['nodes'][i]['name']] = {"id":Graph_data['nodes'][i]['index'], "sims":Graph_data['nodes'][i]['neighbors'], "clicks":0};
							node_names.push(Graph_data['nodes'][i]['name']);
						}

					}
					node_id+=nodes.length;
					var links = [];
					for (var i = 0; i<Graph_data['links'].length; i++){
						links.push({source: node_names.indexOf(Graph_data['links'][i]['source']), target: node_names.indexOf(Graph_data['links'][i]['target']), arrow:1});
					}
				}
				else{
					graphStartMode = 1;
					var nodes = [];
					var links = Graph_data['links'];
					for (i = 0; i<links.length; i++){
						links[i].arrow = 0;
					}
					node_id+=nodes.length;
					for (var i = 0; i<Graph_data['nodes'].length; i++){
						nodes_current[Graph_data['nodes'][i]['name']] = {"id":Graph_data['nodes'][i]['id'], "sims":Graph_data['nodes'][i]['sims'], "clicks":Graph_data['nodes'][i]['clicks']};
						nodes.push({id:Graph_data['nodes'][i]['id'], name:Graph_data['nodes'][i]['name']});
					}
					node_id+=nodes.length;
				}
				graph1.add(nodes, links);
				graphStartMode = 0;

				setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
				var timestamp = Date.now();
				writeLog('t2graphNew'+'\t'+timestamp.toString()+'\t'+JSON.stringify(Graph_data)+'\n');
				},
			error: function() {
					alert('Error!');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0);
				}
	});


}

function createCSV(input){
	//input is an array
	//const rows = [["name1", "city1", "some other info"], ["name2", "city2", "more info"]];
	var rows = input;
	let csvContent = "data:text/csv;charset=utf-8,";

	csvContent += "\r\n";

	rows.forEach(function(rowArray){
   	let row = rowArray.join(",");
   	csvContent += row + "\r\n";
	});
	var encodedUri = encodeURI(csvContent);
	var link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", "adjacency_matrix.csv");
	document.body.appendChild(link); // Required for FF
	link.click(); // This will download the data file.
}

function topnsimilar(){
	var word = $("#word").val();
	if (word.charAt(word.length-1) == ' ' || word.charAt(word.length-1) == '\n'){
		word = word.substring(0, word.length-1);
	}
	var loadingModal = document.getElementById('loadingModal');

	if (word.length == 0){
		alert('No input!');
		return (0)
	}
	word = word.replace(' ', '_');
	word = word.toLowerCase();
	$("#loadingModal").modal({
		      backdrop: "static", //remove ability to close modal with click
		      keyboard: false, //remove option to close with keyboard
		      show: false //Display loader!
		    });
	$.ajax({
			url: API_URL_HOST + '/topn',
			type: "POST",
			contentType: 'application/json',
			dataType: 'json',
			async: true,
			data: JSON.stringify({"userid":userid, "word": word}),
			success: function(response) {
				console.log(response);

				if (response['error']!=null){
					$('#word2manyResult').html ('Error: The term cannot be found in EKG');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0)
				}
				if (response['top20'][0] == 0){
					$('#word2manyResult').html ('Error: The term cannot be found in EKG');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0)
				}
				top20 = response['top20'];
				var text = "";
				for (var i = 0; i<9;i++){//top20.length
					text = text + top20[i][0].replace(/_/g, ' ') + '<br />';
				}
                
                var second_tier = "";
                second_tier = second_tier + top20[1][0].replace(/_/g, ' ');
                
                
				console.log(text);
				$('#word2manyResult').html (text);
				setTimeout(function() {$("#loadingModal").modal("hide");}, 500);

				var timestamp = Date.now();
				writeLog('topN'+'\t'+timestamp.toString()+'\t'+word+'\n');
                
                
                    $.ajax({
			url: API_URL_HOST + '/topn',
			type: "POST",
			contentType: 'application/json',
			dataType: 'json',
			async: true,
			data: JSON.stringify({"userid":userid, "word": second_tier}),
			success: function(response) {
				console.log(response);

				if (response['error']!=null){
					$('#word2manyResult2').html ('Error: The term cannot be found in EKG');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0)
				}
				if (response['top20'][0] == 0){
					$('#word2manyResult2').html ('Error: The term cannot be found in EKG');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0)
				}
				top20 = response['top20'];
				var text = "";
				for (var i = 0; i<9;i++){//top20.length
					text = text + top20[i][0].replace(/_/g, ' ') + '<br />';
				}
				console.log(text);
				$('#word2manyResult2').html (text);
				setTimeout(function() {$("#loadingModal").modal("hide");}, 500);

				var timestamp = Date.now();
				writeLog('topN'+'\t'+timestamp.toString()+'\t'+word+'\n');
			},
			error: function() {
					$('#word2manyResult2').html ('Error: The term cannot be found in EKG');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
			}
	});


                
			},
			error: function() {
					$('#word2manyResult').html ('Error: The term cannot be found in EKG');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
			}
        
	});

}

function topnsimilar2(){
	var word = $("#word").val();
	if (word.charAt(word.length-1) == ' ' || word.charAt(word.length-1) == '\n'){
		word = word.substring(0, word.length-1);
	}
	var loadingModal = document.getElementById('loadingModal');

	if (word.length == 0){
		alert('No input!');
		return (0)
	}
	word = word.replace(' ', '_');
	word = word.toLowerCase();
	$("#loadingModal").modal({
		      backdrop: "static", //remove ability to close modal with click
		      keyboard: false, //remove option to close with keyboard
		      show: false //Display loader!
		    });
	$.ajax({
			url: API_URL_HOST + '/topn',
			type: "POST",
			contentType: 'application/json',
			dataType: 'json',
			async: true,
			data: JSON.stringify({"userid":userid, "word": word}),
			success: function(response) {
				console.log(response);

				if (response['error']!=null){
					$('#word2manyResult').html ('Error: The term cannot be found in EKG');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0)
				}
				if (response['top20'][0] == 0){
					$('#word2manyResult').html ('Error: The term cannot be found in EKG');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					return (0)
				}
				top20 = response['top20'];
				var text = "";
				for (var i = 0; i<9;i++){//top20.length
					text = text + top20[i][0].replace(/_/g, ' ') + '<br />';
				}
                
                var text2 = "";
				for (var i = 9; i<18;i++){//top20.length
					text2 = text2 + top20[i][0].replace(/_/g, ' ') + '<br />';
				}
                
                var text3 = "";
				for (var i = 18; i<27;i++){//top20.length
					text3 = text3 + top20[i][0].replace(/_/g, ' ') + '<br />';
				}
                
				console.log(text);
				$('#word2manyResult').html (text);
                $('#word2manyResult2').html (text2);
                $('#word2manyResult3').html (text3);
				setTimeout(function() {$("#loadingModal").modal("hide");}, 500);

				var timestamp = Date.now();
				writeLog('topN'+'\t'+timestamp.toString()+'\t'+word+'\n');
                
			},
			error: function() {
					$('#word2manyResult').html ('Error: The term cannot be found in EKG');
					setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
			}
        
	});

}

function topNs(word){
	if (word.length == 0){
		alert('No input!');
		return (0)
	}
	if (word.charAt(word.length-1) == ' ' || word.charAt(word.length-1) == '\n'){
		word = word.substring(0, word.length-1);
	}

	word = word.replace(' ', '_');
	word = word.toLowerCase();
	$.ajax({
			url: API_URL_HOST + '/topn',
			type: "POST",
			contentType: 'application/json',
			dataType: 'json',
			async: true,
			data: JSON.stringify({"userid":userid, "word": word}),
			success: function(response) {
				console.log(response);

				if (response['error']!=null){
					return (0)
				}

				if (response['top20'][0] == 0){
					return (0)
				}
				nodes_current[response['word']] = {"id":node_id, "sims":response['top20'], "clicks":0};
				node_id+=1
			},
			error: function() {
				alert('error');
				return (0)
			}
	});
}

// function initialize(){
// 	userid = Math.floor(Math.random() * 1000000) + 1000000; // returns a random integer from 1 to 100
// 	$("#d3ADJ").hide();
// }


function cleanSearchText(){
	//tokenize and split search phrases
	var i = document.getElementById('searchText').value;
	//makes text into the following
	i = i.replace(/ +/g, ' ');
	i = i.replace(/ ;/g,";");
	i = i.replace(/; /g,";");
	i = i.replace(/ /g,"_");

	if (i.search(/[^ _]/g) == -1 ){
		//i.search will return -1 if text contains only " " and "_"
		i = "";
	}
	return i.split(';');
}

function updateResults(resultSet){
	document.getElementById('resultsBox').innerHTML = '';
	// document.getElementById("prevIteration").innerHTML = displayedIteration+1;
	var resultLength = resultSet.length;

	// if (resultSet.length < 1000){
	// 	resultLength = resultSet.length;
	// }

	for (var i = 0; i < resultLength; i++){
		var j = resultSet[i];
		if (selectedKeywords.indexOf(j) != -1){
			generateResultItem(j,true);
		}
		else{
			generateResultItem(j,false);
		}
	}
}

function updateSearchBox(){
	document.getElementById('searchBoxItems').innerHTML = '';
	for (var i = 0; i < selectedKeywords.length; i++){
		generateSearchItem(selectedKeywords[i]);
	}
}

function pressSearch(){
		var searchText = cleanSearchText();
		if (searchText.indexOf('') != -1){
			searchText = [];
		}

		allKeywords = searchText.concat(allKeywords);
		selectedKeywords = selectedKeywords.concat(searchText);
		var toSearch = makeSet(selectedKeywords);
		console.log(toSearch);
		console.log(previousSearchKeywords);
		if (toSearch.length == 0){
			alert("Empty Search!");
		}
		else if (arraysEqual(toSearch,previousSearchKeywords)){
			alert ("Same Search!");
		}
		else{
			var loadingModal = document.getElementById('loadingModal');
			previousSearchKeywords = toSearch;
			$("#loadingModal").modal({
		      backdrop: "static", //remove ability to close modal with click
		      keyboard: false, //remove option to close with keyboard
		      show: true //Display loader!
		    });

			$.ajax({
					url: API_URL_HOST + '/keywordSearch',
					type: "POST",
					contentType: 'application/json',
					dataType: 'json',
					async: true,
					data: JSON.stringify({ "userid": userid , "keywords": toSearch }),
					success: function(response) {
						console.log(response);


						var newKeyWords  = response['keywords'];
						var patentCount  = response['patent_count'];

						//copy() is a function to "deep copy" arrays
						var iterSelectedKeywords = copy(selectedKeywords);
						var iterAllKeywords = copy(allKeywords);

						currentKeywords = difference(newKeyWords,iterAllKeywords);

						searchIterations.push({'selectedKeywords': iterSelectedKeywords , 'allKeywords': iterAllKeywords , 'returnedKeywords' : currentKeywords });
						//generateIterationHistory();

						displayedIteration = iterationCount;
						if (iterationCount >=0){
							document.getElementById("searchText").hidden = true;
						}

						allKeywords = makeSet(newKeyWords.concat(allKeywords));
						updateResults(newKeyWords);
						previousKeywords = newKeyWords;
						updateSearchBox();
						document.getElementById("searchText").value = "";
						// document.getElementById("keywordCount").innerHTML = allKeywords.length;
						document.getElementById("numKeywords").innerHTML = newKeyWords.length;
						// document.getElementById("patentCount").innerHTML = patentCount;
						document.getElementById("numPatents").innerHTML = patentCount;
						document.getElementById('resultsContainer').hidden = false;
						setTimeout(function() {$("#loadingModal").modal("hide");}, 500);

						iterationCount += 1 ;
						// document.getElementById("iterationCount").innerHTML = iterationCount;

					},
					error: function() {
						document.getElementById('resultsContainer').hidden = false;
						document.getElementById('resultsContainer').innerHTML = '<p> An error has occured. Please refresh the page. </p>';
						setTimeout(function() {$("#loadingModal").modal("hide");}, 500);
					}

				});
		}
}

function browseIterations(direction){ //direction is 1 or -1
	if ((displayedIteration != iterationCount - 1) || displayedIteration != 0 ){
		if (displayedIteration == 0 && direction == -1){
			displayedIteration += 0;
		}
		else if (displayedIteration == iterationCount - 1 && direction == 1){
			displayedIteration += 0;
		}
		else{
			displayedIteration += direction;
		}
	}

	var resultSet = searchIterations[displayedIteration]['returnedKeywords'];
	updateResults(resultSet);

}


//DOM object generators

function generateResultItem(inputText,isHidden){
	var newItem = document.createElement("div");
	newItem.setAttribute('class','resultItem noselect');
	newItem.innerHTML = inputText;
	if(isHidden){ newItem.hidden = true };
	newItem.addEventListener('dblclick', function(){ generateSearchItem(inputText) } );
	newItem.addEventListener('dblclick', function(){ this.hidden = true ; } );
	newItem.addEventListener('dblclick', function(){ selectedKeywords.push(inputText) } );
	if (previousKeywords.indexOf(inputText) != -1){
		newItem.style.color = 'darkgrey';
	}
	document.getElementById('resultsBox').appendChild(newItem);
}

function generateSearchItem(inputText){
	var newItem = document.createElement("a");
	newItem.setAttribute('class','searchItem noselect');
	newItem.innerHTML = inputText;
	newItem.addEventListener('dblclick', function(){ removeFromArray(selectedKeywords,inputText) ; } );
	newItem.addEventListener('dblclick', function(){ unhideResultItem(inputText) } );
	newItem.addEventListener('dblclick', function(){ this.parentNode.removeChild(this)} );
	document.getElementById('searchBoxItems').appendChild(newItem);

	function unhideResultItem(text){
		var i = document.getElementsByClassName('resultItem');
		for (var a = 0 ; a < i.length ; a++){
			if (i[a].innerHTML == text){
				i[a].hidden = false;
			}
		}
	}

}

/* GENERATE ITERATION HISTORY MODAL */
/*
function generateIterationHistory(){
	var card = document.createElement("div");
	card.setAttribute('class','card card-body');

	var title = document.createElement('h5');
	title.setAttribute('class','card-title');
	title.innerHTML = 'Iteration #' + (iterationCount + 1);
	card.appendChild(title);

	var prev = document.createElement('div');

	for (var i = 0; i < selectedKeywords.length ; i++){
		var newItem = document.createElement("a");
		newItem.setAttribute('class','prevItem noselect');
		newItem.innerHTML = selectedKeywords[i];
		prev.appendChild(newItem);
	}

	card.appendChild(prev);
	document.getElementById('iterationHistoryBody').appendChild(card);

}
*/

// General use functions
function makeSet(array){
	var i = new Set(array);
	return Array.from(i)
}

function removeFromArray(array,value){
	while (array.indexOf(value) != -1){
		array.splice(array.indexOf(value),1);
	}
}

function difference(arrayA, arrayB) {
  // set A minus intersect
  var setA = new Set(arrayA);
  var setB = new Set(arrayB);
    var _difference = new Set(setA);
    for (var elem of setB) {
        _difference.delete(elem);
    }

    _difference = Array.from(_difference);

    return _difference;
}

function copy(o) {
   var output, v, key;
   output = Array.isArray(o) ? [] : {};
   for (key in o) {
       v = o[key];
       output[key] = (typeof v === "object") ? copy(v) : v;
   }
   return output;
}

function treeGraph(tree){
	$("#d3Tree").html("");

	console.log(tree);
	var width = 960;
    var height = 600;

    graph = tree

	var svg = d3.select('#d3Tree').append("p").attr("id", "d3Tree_svg")
		.append("svg")
	    .attr("width", width)
	    .attr("height", height);

	var color = d3.scaleOrdinal(d3.schemeCategory20);

	var simulation = d3.forceSimulation()
	    .force("link", d3.forceLink().id(function(d) { return d.name; }).distance(50).strength(1))
	    .force("charge", d3.forceManyBody().strength(-150))
	    .force("center", d3.forceCenter(width / 2, height / 2));



	var link = svg.append("g")
	    .attr("class", "links")
	    .selectAll("line")
	    .data(graph.links)
	    .enter().append("line")
	    .attr("stroke-width", function(d) { return Math.sqrt(d.weight); });

	var node = svg.append("g")
	    .attr("class", "nodes")
	    .selectAll("g")
	    .data(graph.nodes)
	    .enter().append("g")

	var circles = node.append("circle")
	    .attr("r", 5)
	    .attr("fill", function(d) { return color(d.group); })
	    .call(d3.drag()
	    .on("start", dragstarted)
      	.on("drag", dragged)
      	.on("end", dragended));

	var lables = node.append("text")
	      .text(function(d) {return d.name;})
	      .attr('x', 6)
	      .attr('y', 3);

	node.append("title")
	      .text(function(d) { return d.name; });

	simulation
	      .nodes(graph.nodes)
	      .on("tick", ticked);

	simulation.force("link")
	      .links(graph.links);

	function ticked() {
	    link
	        .attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { return d.target.x; })
	        .attr("y2", function(d) { return d.target.y; });

	    node
	        .attr("transform", function(d) {
	          return "translate(" + d.x + "," + d.y + ")";
	        })
 	}

	function dragstarted(d) {
	  	if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	  	d.fx = d.x;
	  	d.fy = d.y;
	}

	function dragged(d) {
  		d.fx = d3.event.x;
  		d.fy = d3.event.y;
	}

	function dragended(d) {
  		if (!d3.event.active) simulation.alphaTarget(0);
  		d.fx = null;
  		d.fy = null;
	}


}





// d3.js Matrix functions

function d3matrix(miserables){
	$('#d3ADJ').show();
	$("#d3ADJ_mtx").html("");


	// d3.select("d3ADJ_svg").remove();

	var margin = {top: 240, right: 0, bottom: 10, left: 240},
				    width = 840,
				    height = 840;

	// var x = d3.scale.ordinal().rangeBands([0, width]),
	//     z = d3.scale.linear().domain([0, 4]).clamp(true),
	//     c = d3.scale.category10().domain(d3.range(10));

	var x = d3.scaleBand().rangeRound([0, width]),
	    z = d3.scaleLinear().domain([0, 2]).clamp(true),
	    c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));

	// var svg = d3.select('.container').append("div").attr("class", "col-sm-12")
	// 	.append("svg")
	//     .attr("width", width + margin.left + margin.right)
	//     .attr("height", height + margin.top + margin.bottom)
	//     .style("margin-left", -margin.left + "px")
	//   .append("g")
	//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	var svg = d3.select('#d3ADJ_mtx').append("p").attr("id", "d3ADJ_svg")
		.append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .style("margin-left", -margin.left + "px")
	  	.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var matrix = [],
	    nodes = miserables.nodes,
	    n = nodes.length;

	  // Compute index per node.
	nodes.forEach(function(node, i) {
	    node.index = i;
	    node.count = 0;
	    matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
	  });

	  // Convert links to matrix; count character occurrences.
	miserables.links.forEach(function(link) {
	    matrix[link.source][link.target].z += link.value;
	    matrix[link.target][link.source].z += link.value;
	    matrix[link.source][link.source].z = 1;
	    matrix[link.target][link.target].z = 1;
	    nodes[link.source].count += 1;
	    nodes[link.target].count += 1;
	  });

	  // Precompute the orders.
	var orders = {
	    name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
	    count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
	    group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; }),
	    cluster:d3.range(n).sort(function(a, b) { return nodes[b].partition - nodes[a].partition;})
	  };

	  // The default sort order.
	x.domain(orders.cluster);

	svg.append("rect")
	    .attr("class", "background")
	    .attr("width", width)
	    .attr("height", height);

	var row = svg.selectAll(".row")
	    .data(matrix)
	    .enter().append("g")
	    .attr("class", "row")
	    .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
	    .each(row);

	row.append("line")
	    .attr("x2", width);

	row.append("text")
		.style('font-family', "Arial")
		.style('font-size', 18)
	    .attr("x", -6)
	    .attr("y", x.bandwidth() / 2)
	    .attr("dy", ".32em")
	    .attr("text-anchor", "end")
	    .text(function(d, i) { return nodes[i].name; });

	var column = svg.selectAll(".column")
	    .data(matrix)
	    .enter().append("g")
	    .attr("class", "column")
	    .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

	column.append("line")
	    .attr("x1", -width);

	column.append("text")
		.style('font-family', "Arial")
		.style('font-size', 18)
	    .attr("x", 6)
	    .attr("y", x.bandwidth() / 2)
	    .attr("dy", ".32em")
	    .attr("text-anchor", "start")
	    .text(function(d, i) { return nodes[i].name; });

	function row(row) {
	    var cell = d3.select(this).selectAll(".cell")
	        .data(row.filter(function(d) { return d.z; }))
	      	.enter().append("rect")
	        .attr("class", "cell")
	        .attr("x", function(d) { return x(d.x); })
	        .attr("width", x.bandwidth())
	        .attr("height", x.bandwidth())
	        .style("fill-opacity", function(d) { return z(d.z)*5; })
	        .style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
	        .on("mouseover", mouseover)
	        .on("mouseout", mouseout);
	}

	function mouseover(p) {
	    d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
	    d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
	}

	function mouseout() {
	    d3.selectAll("text").classed("active", false);
	}

	d3.select("#order").on("change", function() {
	    clearTimeout(timeout);
	    order(this.value);
	});

	function order(value) {
	    x.domain(orders[value]);

	    var t = svg.transition().duration(2500);

	    t.selectAll(".row")
	        .delay(function(d, i) { return x(i) * 4; })
	        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
	      .selectAll(".cell")
	        .delay(function(d) { return x(d.x) * 4; })
	        .attr("x", function(d) { return x(d.x); });

	    t.selectAll(".column")
	        .delay(function(d, i) { return x(i) * 4; })
	        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
	}

	var timeout = setTimeout(function() {
	    order("group");
	    d3.select("#order").property("selectedIndex", 2).node().focus();
	  }, 5000);

}
