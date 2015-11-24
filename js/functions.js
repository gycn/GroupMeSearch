var base = "https://api.groupme.com/v3";
var groups = null;
var messages = null;
var tkn = null;
var idx = null;
var indexedMessages = null;
var currentid = null;
function getGroups(tkn)
{
	$.get( makeUrl("/groups"), { token: tkn } )
	  .done(function( data, status ) {
	  	var temp = []
	    data.response.forEach(function(grp) {
	    	temp.push({name: grp.name, id: grp.id});
	    });
	    groups = temp;
	    showSecond();
	  }).fail(function () {
	  	$("#error_message").text("Error connecting to GroupMe server. Check your API key or your internet connection.");
	  });
}

function makeUrl(ext)
{
	return base + ext;
}

function showIntro()
{
	$("#second").hide();
	$("#intro").show();
	groups = null;
	messages = null;
	tkn = null;
	idx = null;
	currentid = null;
	indexedMessages = null;
}

$(document).ready(function() {
	$("#login_button").click(function(e) {
		e.preventDefault();
		var key = $.trim($("#api_field").val());
		if (key == "")
		{
			$("#error_message").text("Field is empty.")
		}
		else
		{
			tkn = key;
			getGroups(key);
		}
	});
	$("#logout").click(function(e){
		e.preventDefault();
		showIntro();
	});
});

function makeGroupItem(name,id)
{
	var temp = $("<li><a href='#'>" + name + "</a></li>");
	temp.data("id", id);
	return temp;
}

function makeActiveGroupItem(name,id)
{
	var temp = $("<li class='active'><a href='#'>" + name + "</a></li>");
	temp.data("id", id);
	return temp;
}

function addItemToGroup(item)
{
	item.appendTo($("#groups"));
	item.click(function(e) {
		if (!item.hasClass("active"))
		{
			var id = item.data("id");
			$(".active").removeClass("active");
			item.addClass("active");
			loadNewGroup(id);
		}
	});

}

function loadNewGroup(id)
{
	currentid = id;
	resetMessages();
	loadGroupMessages(id,null,0);
	idx = lunr(function () {
		this.ref('id');
	    this.field('text', { boost: 10 });
	    this.field('author');
	});
}

function loadGroupMessages(id,previous, lastcount)
{
	if(!($("#second").css('display') == 'none'))
	{
		var count = lastcount
		$.get( makeUrl("/groups/" + id + "/messages"),  {token: tkn, limit: 100, before_id:previous})
		  .done(function( data, status, xhr ) {
		  	if (xhr.status != 304)
		  	{
		  		var temp = [];
		  		data.response.messages.forEach(function(msg) {
		  			if (currentid == id)
		  			{
			  			var item = ({poster: msg.name, text: msg.text, likes:msg.favorited_by.length, date:msg.created_at});
			  			temp.push(item);
			  			var msgitem = jQuery.extend({}, item);
			  			msgitem.obj = makeMessageItem(msgitem);
			  			msgitem.id = count;
			  			messages.push(msgitem);
			  			indexedMessages[count] = msgitem;
			  			idx.add(msgitem);	
			  			srch($("#search").val());
			  			count+=1;
			  		}
			  		else
			  		{
			  			return;
			  		}
		  		});
		  		loadGroupMessages(id, data.response.messages[data.response.messages.length-1].id,count);
		  	}
		  	
		  }).fail(function () {
		  	alert("Couldn't grab messages.");
		  });
	}
}

function srch(words)
{
	clearMessages();
	if(words)
	{
		var result = idx.search(words);
		result.sort(function(a,b){
			return indexedMessages[b.ref].date - indexedMessages[a.ref].date;
		});
		result.forEach(function(res){
			displayMessage(indexedMessages[res.ref]);
		});
	}
	else
	{
		messages.forEach(function(msg){
			displayMessage(msg);
		});
	}
}

function clearMessages()
{
	$("#posts tbody tr").detach();
}

function resetMessages()
{
	clearMessages();
	messages = [];
	indexedMessages= {};
}

function displayMessage(msg)
{
	msg.obj.appendTo($("#posts"));
}

function makeMessageItem(msg)
{
	return $("<tr>"+tdWrap(msg.poster) + tdWrap(msg.text) + tdWrap((new Date(parseInt(msg.date)*1000)).toDateString()) + tdWrap(msg.likes) + "</tr>");
}

function tdWrap(text)
{
	return "<td>" + text + "</td>";
}

function showSecond()
{
	if (groups)
	{	

		$("#intro").hide();
		$("#second").show();
		$("#groups li").remove();
		addItemToGroup(makeActiveGroupItem(groups[0].name,groups[0].id));
		for (var i = 1; i < groups.length; i++)
		{
			addItemToGroup(makeGroupItem(groups[i].name,groups[i].id))
		}
		$("#search").on('input',function(){
			srch($("#search").val());
		});
		loadNewGroup(groups[0].id);
	}
}
