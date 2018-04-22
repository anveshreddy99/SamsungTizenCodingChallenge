//older key : 452b8f7030cb7b7f9225a92c71ed84bb
//api key : 2fb94b4c526128abacc00433ad6190b6
var nowPlaying_counter =0,
    upcoming_counter=0,
    gRemoteMessagePort =null,
    gLocalMessagePort=null,
    gLocalMessagePortWatchId=null,
    nowPlaying_movies="",
    upcoming_movies="",
    genres="",
    first_genre_resquest=true,
    localMessagePortName="WEB_APP_PORT",
    serviceMessagePortName="SERVICE_PORT",
    serviceAppId="fRA8MO1bp8.movieservice",
    genre_url="https://api.themoviedb.org/3/genre/movie/list?language=en-US&api_key=2fb94b4c526128abacc00433ad6190b6",
    movie_url="https://api.themoviedb.org/3/movie/%s?api_key=2fb94b4c526128abacc00433ad6190b6&language=en-US&page=%s",
    webAPPId="fRA8MO1bp8.TAUMultiPage";
    


function trigger_popup(message)
{
	console.log("in popup");
	console.log(message);
	console.log(document.getElementById("error_popup"));
	document.getElementById("popup_message").innerHTML=message;
	tau.openPopup(document.getElementById("error_popup"));
}

function closePopup()
{
	console.log("closing popup");
	tau.closePopup();
	stopService();
	tizen.application.getCurrentApplication().exit();
}




function loading(load)
{
	if(load===true)
		{
		 $(".loading").fadeIn();
		}
	else {
		{
			 $(".loading").fadeOut();	
		}
	}
}


function moreButton(button,totalPages)
{	
	if(button==="now_showing_btn")
		{
		if(nowPlaying_counter<=totalPages)
			{
			document.getElementById(button).style.display="block";
			}
		else {
			document.getElementById(button).style.display="none";
		}
		}
	if(button==="upcoming_btn")
	{
	if(upcoming_counter<=totalPages)
		{
		document.getElementById(button).style.display="block";
		}
	else {
		document.getElementById(button).style.display="none";
	}
	}
	
}





function writeToNowShowing(list,button,message)
{console.log("in writing");
//console.log(message);
var listNode = document.getElementById(list);
var buttonNode = document.getElementById(button);
var obj=null;
	try{
		obj= JSON.parse(message);
	}catch(err)
	{
		/*if(buttonNode.style.display==="block")
    	{
    	buttonNode.style.display="none";
    	}*/
		console.log(err.message + " in writeToUpcoming(error in parsing) " + message);
		return;
		
	}
	    console.log("entered write fine");
	    
	    //console.log("entered write fine" + buttonNode);
	    /*if(buttonNode.style.display==="none")
	    	{
	    	buttonNode.style.display="block";
	    	}*/
	    moreButton(button,Number(obj.total_pages));
	    //console.log("writing done" +buttonNode);
	    for(var i=0;i<obj.results.length;i++)
	    	{
	    	var listElement = document.createElement("li");
	    	var anchor=document.createElement("a");
	    	var span=document.createElement("span");
	    	//store in the session
	    	var store= obj.results[i].title+"$$$$"+obj.results[i].poster_path+"$$$$"+obj.results[i].release_date+"$$$$"+obj.results[i].overview;
	    	store=store+"$$$$"+obj.results[i].genre_ids;
	    	sessionStorage.setItem(obj.results[i].id, store);
	    	//console.log(sessionStorage.getItem(obj.results[i].id));
	    	listElement.setAttribute('class',"ui-li-anchor");
	    	listElement.setAttribute('id', obj.results[i].id);
	    	listElement.setAttribute('onclick',"detailsPage(this.id)");
	    	anchor.setAttribute('href', "");
	    	span.setAttribute('class',"li-text-sub");
	    	anchor.innerHTML = obj.results[i].title;
	    	span.innerHTML = obj.results[i].vote_average;
	    	anchor.appendChild(span);
	    	listElement.appendChild(anchor);
	    	listNode.appendChild(listElement);
	    	}
	    console.log("writing done");
	    loading(false);

}




function detailsPage(id)
{
	
	console.log(id);
	//details_id=id;
	sessionStorage.setItem("page", id);
	if(first_genre_resquest===true)
	{
	genre();
	//first_genre_resquest=false;
	}
	else {
		
		tau.changePage('movieDetails.html');
	}
	
}

function storeGenre(message)
{
	console.log(message);
	var obj=null;
	try{
		obj= JSON.parse(message);
	}catch(err)
	{
		
		console.log(err.message + " Error in parsing genre " + message);
		return;
	}
	console.log("parsed genere");
	for(var i=0;i<obj.genres.length;i++)
		{
		sessionStorage.setItem("g"+obj.genres[i].id, obj.genres[i].name);
		}
	console.log("going to movie details page");
	first_genre_resquest=false;
	loading(false);
	tau.changePage('movieDetails.html');
}


function onReceive(data)
{
	console.log(data[0].key + " " + data[0].value);
	//console.log(data[1].key + " " + data[1].value);
	
	if(data[0].key==="playing_now")
		{
		if(data[0].value==="start")
			{
			nowPlaying_movies="";
			}
		else if(data[0].value==="Error")
			{
			loading(false);
			console.log("error in playing now");
			trigger_popup("Error in connection.Please try later!!!");
			}
		else if(data[0].value==="end")
			{
			
			writeToNowShowing('now_showing','now_showing_btn',nowPlaying_movies);
			nowPlaying_movies="";
			}
		else 
			{
			nowPlaying_movies=nowPlaying_movies.concat(data[0].value);
			}
		
		}
	else if(data[0].key==="upcoming_movies")
	{
		
		if(data[0].value==="start")
			{
			upcoming_movies="";
			}
		
		else if(data[0].value==="Error")
			{
			loading(false);
			console.log("error in upcoming movies");
			trigger_popup("Error in connection.Please try later!!!");
			}
		else if(data[0].value==="end")
			{
			writeToNowShowing('upcoming','upcoming_btn',upcoming_movies);
			upcoming_movies="";
			}
		else 
			{
			upcoming_movies=upcoming_movies.concat(data[0].value);
			}
		
	}
	else if(data[0].key==="genre")
	{
		if(data[0].value==="start")
			{
			genres="";
			}
		else if(data[0].value==="Error")
		{
			loading(false);
			console.log("error in genres");
			trigger_popup("Error in connection.Please try later!!!");
		}
		else if(data[0].value==="end")
			{
			console.log("finished receiving genre");
			storeGenre(genres);
			genres="";
			}
		else 
			{
			genres=genres.concat(data[0].value);
			}
		
	}
	
}


function sendCommand_upcoming() {
    'use strict';
    
    try {
    	 //start();
    	 loading(true);
    	upcoming_counter=upcoming_counter+1;
    	console.log(upcoming_counter.toString());
        gRemoteMessagePort.sendMessage([{key: 'command', value: "upcoming_movies"},{key:"data", value:upcoming_counter.toString()}],
            gLocalMessagePort);
        console.log("done sending");
       // writeToScreen('Sending: ');
    } catch (error) {
    	loading(false);
    	trigger_popup("Port Error.Please try later!!!");
    	 console.log("error in sending upcoming" + error.message);
    	 upcoming_counter=upcoming_counter-1; 	 
    }
    	
}

function genre() {
    'use strict';
    loading(true);
    try {
    	console.log("sending genre");
        gRemoteMessagePort.sendMessage([{key: 'command', value: "genre"},{key:"data", value:"dummy"}],
            gLocalMessagePort);
        console.log("genre sent");
        //writeToScreen('Sending: ');
    } catch (error) {
    	loading(false);
    	trigger_popup("Port Error.Please try later!!!");
        console.log(error + "error in genre");
    }
}





function sendCommand_nowShowing() {
    'use strict';
   
    try {
    	
    	//start();
    	 //start();
    	 loading(true);
    	nowPlaying_counter=nowPlaying_counter+1;
    	
       
    	console.log(nowPlaying_counter.toString());
    	var messageData = [
    	                   {key:'command', value:"playing_now"},
    	                   {key:'data', value:nowPlaying_counter.toString()}
    	                   
    	               ];
        gRemoteMessagePort.sendMessage(messageData);
       
        console.log("done sending");
        //writeToScreen('Sending: ');
    } catch (error) {
    	if(gRemoteMessagePort===null)
    		{
    		console.log("gRemoteMessagePort is null");
    		}
    	loading(false);
    	trigger_popup("Port Error.Please try later!!!");
    	//loading(false);
        console.log("error in sending nowshowing" + error.message);
    }
    	
}





function startMessagePort() {
    'use strict';

    try {
    	console.log("local port");
        gLocalMessagePort = tizen.messageport
            .requestLocalMessagePort(localMessagePortName);
        console.log("local port 2");
        gLocalMessagePortWatchId = gLocalMessagePort
            .addMessagePortListener(function onDataReceive(data, remote) {
                onReceive(data, remote);
            });
        console.log("local port 3");
    } catch (e) {
    	// gLocalMessagePort = null;
    	loading(false);
    	trigger_popup("Port Error.Please try later!!!");
        console.log("Error in local messageport creation "+ e.message);
    }

    try {
    	console.log("remote port");
    	 gRemoteMessagePort = tizen.messageport
            .requestRemoteMessagePort(serviceAppId,serviceMessagePortName);
    	 console.log("remote port");
    } catch (ex) {
    	//gRemoteMessagePort = null;
    	loading(false);
    	trigger_popup("Port Error.Please try later!!!");
        console.log("Error in remote messageport creation "+ ex.message);
    }

    if(nowPlaying_counter===0)
    	{
      sendCommand_nowShowing();
      //data_exchange=true;
    	}
      
}






function launchServiceApp() {
    'use strict';

    function onSuccess() {
    	startMessagePort();
    }

    function onError(err) {
    	loading(false);
    	trigger_popup("Service not found. Please try later!!!");
        console.log('Service Applaunch failed', err);   
    }

    try {
    	/*var servicePort= new tizen.ApplicationControlData("servicePort", [serviceMessagePortName]);
    	var localPort = new tizen.ApplicationControlData("webAppPort", [localMessagePortName]);
    	var moviesURL=  new tizen.ApplicationControlData("moviesURL", [movie_url]);
    	var genreURL= new tizen.ApplicationControlData("genresURL", [genre_url]);
    	var webApp= new tizen.ApplicationControlData("webAppId", [webAPPId]);
    	
    	tizen.application.launchAppControl(new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/service",null,null,null,[servicePort,localPort,moviesURL,genreURL,webApp]),
    			serviceAppId,
    			onSuccess,
    			onError
    			);*/
        tizen.application.launch(serviceAppId, onSuccess, onError);
    	
    } catch (exc) {
        console.log('Exception while launching HybridServiceApp: ' +
            exc.message);
        trigger_popup("Service not found. Please try later!!!");
       
    }
}

function onGetAppsContextSuccess(contexts) {
    'use strict';

    var i = 0,
        len = contexts.length,
        appInfo = null;

    for (i = 0; i < len; i = i + 1) {
        try {
            appInfo = tizen.application.getAppInfo(contexts[i].appId);
        } catch (exc) {
           // showAlert('Exception while getting application info:<br>' +
             //   exc.message);
        }

        if (appInfo.id ===serviceAppId) {
            break;
        }
    }

    if (i >= len) {
        //launchServiceApp();
    	console.log("the service app stopped");
    } else {
    	console.log("the service app is running");
    }
}



function onGetAppsContextError(err) {
    'use strict';

    console.log('getAppsContext exc', err);
}

function start() {
    'use strict';

    try {
        tizen.application.getAppsContext(onGetAppsContextSuccess,
            onGetAppsContextError);
    } catch (e) {
        console.log('Get AppContext Error: ' + e.message);
    }
}

function stopService()
{
	if(gRemoteMessagePort)
	{
	gRemoteMessagePort=null;
	}
	if(gLocalMessagePort)
	{
	try{
		gLocalMessagePort.removeMessagePortListener(gLocalMessagePortWatchId);
		gLocalMessagePort=null;
		
	}
	catch(err)
	{
		console.log("Error in stopping service " + err.message);
	}
	
	
	}
}
window.onload = function() {
    // TODO:: Do your initialization job
	//event handlers
	document.getElementById("now_showing_btn").addEventListener("click",sendCommand_nowShowing);
	document.getElementById("upcoming_btn").addEventListener("click",sendCommand_upcoming);
	document.getElementById("closeApp").addEventListener("click",closePopup);
	document.getElementById("sectionChanger").addEventListener("sectionchange",function(evt)
			   {
		console.debug(evt.detail.active + " section is active.");
		if(upcoming_counter===0 && evt.detail.active==1)
			{
			console.log("sending upcoming");
			sendCommand_upcoming();
			}
	      });

	
	
	
	window.addEventListener('tizenhwkey', function(ev) {
		if (ev.keyName === "back") {
			var activePopup = document.querySelector('.ui-popup-active'),
				page = document.getElementsByClassName('ui-page-active')[0],
				pageid = page ? page.id : "";

			if (pageid === "mainPage" && !activePopup) {
				try {
					//stop service
					stopService();
					tizen.application.getCurrentApplication().exit();
				} catch (ignore) {
				}
			} else {
				window.history.back();
			}
		}
	});
	loading(true);
	launchServiceApp();
	//start();
	     
};






