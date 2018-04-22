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
    serviceAppId="6yEMPL4uwI.tizenmovieservice",
    genre_url="https://api.themoviedb.org/3/genre/movie/list?language=en-US&api_key=2fb94b4c526128abacc00433ad6190b6",
    movie_url="https://api.themoviedb.org/3/movie/%s?api_key=2fb94b4c526128abacc00433ad6190b6&language=en-US&page=%s",
    webAPPId="fRA8MO1bp8.TAUMultiPage",
    popup_shown=false;

/*trigger popup when an error occurs
 * internet connection error,
 * port error- target port not found error
 * service error - unable to launch the service
*/
function trigger_popup(message)
{
	console.log("in popup");
	console.log(message);
	popup_shown=true;
	document.getElementById("popup_message").innerHTML=message;
	tau.openPopup(document.getElementById("error_popup"));
}

//close popup and exit the app
function closePopup()
{
	console.log("closing popup");
	tau.closePopup();
	stopService();
	tizen.application.getCurrentApplication().exit();
}

//show loding screen during communication
function loading(load)
{
	if(load===true)
		 $(".loading").fadeIn();
	else 
		$(".loading").fadeOut();
}

//show button to load more data and hide if all data is shown
function moreButton(button,totalPages)
{	
	if(button==="now_showing_btn")
		{
		if(nowPlaying_counter<=totalPages)
			document.getElementById(button).style.display="block";
		else 
			document.getElementById(button).style.display="none";
		}
	if(button==="upcoming_btn")
	{
	if(upcoming_counter<=totalPages)
		document.getElementById(button).style.display="block";
	else
		document.getElementById(button).style.display="none";
	}
	
}


//update now playing and upcoming list on main screen
function update_list(list,button,message)
{
	console.log("adding to list");
	var listNode = document.getElementById(list);
	var buttonNode = document.getElementById(button);
	var obj=null;
	try{
		obj= JSON.parse(message);
	}catch(err)
	{
		console.log(err.message);
		return;
		
	}
	console.log("updating the list");
	moreButton(button,Number(obj.total_pages));
	
	for(var i=0;i<obj.results.length;i++)
	    {
	    	var listElement = document.createElement("li");
	    	
	    	var anchor=document.createElement("a");
	    	
	    	var span=document.createElement("span");
	    	
	    	//store specific movie details in storage
	    	var store= obj.results[i].title+"$$$$"+obj.results[i].poster_path+"$$$$"+obj.results[i].release_date+"$$$$"+obj.results[i].overview;
	    	
	    	store=store+"$$$$"+obj.results[i].genre_ids;
	    	
	    	sessionStorage.setItem(obj.results[i].id, store);
	    	
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
	 console.log("update done");
	 loading(false);

}



/*show movie details page,
 * if requesting for the first time, we get genres and then show the page
 */
function detailsPage(id)
{
	
	console.log(id);
	sessionStorage.setItem("page", id);
	if(first_genre_resquest===true)
		send(1,"genre");
	else 
		tau.changePage('movieDetails.html');
}

//stores the genres in sessionStorage
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

/*receives data from service app
 * constructs the json string using the start and end signals
*/
function onReceive(data)
{
	console.log(data[0].key + " " + data[0].value);
	
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
			
			update_list('now_showing','now_showing_btn',nowPlaying_movies);
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
			update_list('upcoming','upcoming_btn',upcoming_movies);
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

//send message to service requesting for specific data from server
function send(counter,command)
{	 'use strict';
try {
	
	loading(true);
	console.log(counter.toString());
	var messageData = [
	                   {key:'command', value:command},
	                   {key:'data', value:counter.toString()}
	                   
	               ];
    gRemoteMessagePort.sendMessage(messageData);
    console.log("done sending");
	} catch (error) {
	loading(false);
	console.log("error in sending nowshowing" + error.message);
	trigger_popup("Port Error.Please try later!!!");   
	}
	
}


//creating local and remote message ports
function startMessagePort() {
    'use strict';

    try {
    	console.log("local port creation");
        gLocalMessagePort = tizen.messageport
            .requestLocalMessagePort(localMessagePortName);
        gLocalMessagePortWatchId = gLocalMessagePort
            .addMessagePortListener(function onDataReceive(data, remote) {
                onReceive(data, remote);
            });
    } catch (e) {
    	loading(false);
    	trigger_popup("Port Error.Please try later!!!");
        console.log("Error in local message port creation "+ e.message);
    }

    try {
    	console.log("remote port");
    	 gRemoteMessagePort = tizen.messageport
            .requestRemoteMessagePort(serviceAppId,serviceMessagePortName);
    	 console.log("remote port");
    } catch (ex) {
    	loading(false);
    	trigger_popup("Port Error.Please try later!!!");
        console.log("Error in remote message port creation "+ ex.message);
    }

    if(nowPlaying_counter===0)
    	{
    	nowPlaying_counter=nowPlaying_counter+1;
    	send(nowPlaying_counter, "playing_now");
    	}
      
}





//launch the service app
function launchServiceApp() {
    'use strict';
    function onSuccess() {
    	startMessagePort();
    }

    function onError(err) {
    	loading(false);
    	console.log('Service Applaunch failed', err); 
    	trigger_popup("Service not found. Please try later!!!");   
    }

    try {
    	/*var servicePort= new tizen.ApplicationControlData("servicePort", [serviceMessagePortName]);
    	var localPort = new tizen.ApplicationControlData("webAppPort", [localMessagePortName]);
    	var moviesURL=  new tizen.ApplicationControlData("moviesURL", [movie_url]);
    	var genreURL= new tizen.ApplicationControlData("genresURL", [genre_url]);
    	var webApp= new tizen.ApplicationControlData("webAppId", [webAPPId]);
    	
    	tizen.application.launchAppControl(new tizen.ApplicationControl(null,null,null,null,[servicePort,localPort,moviesURL,genreURL,webApp]),
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

/*check if the service app is already launched
 * if not launch the service app,
 * if already running start the message porting
 */
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
        launchServiceApp();
    } else {
    	startMessagePort();
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

//stoping the service
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
	//event handlers for show more button, close popup and tab change
	document.getElementById("now_showing_btn").addEventListener("click",send_playing=function(){nowPlaying_counter=nowPlaying_counter+1; send(nowPlaying_counter, "playing_now");});
	document.getElementById("upcoming_btn").addEventListener("click",send_upcoming=function(){upcoming_counter=upcoming_counter+1;send(upcoming_counter, "upcoming_movies");});	
	document.getElementById("closeApp").addEventListener("click",closePopup);
	document.getElementById("sectionChanger").addEventListener("sectionchange",function(evt)
			   {
				console.debug(evt.detail.active + " section is active.");
				if(upcoming_counter===0 && evt.detail.active==1)
				{
					console.log("sending upcoming");
					upcoming_counter=upcoming_counter+1;
					send(upcoming_counter, "upcoming_movies");
				}
	      });
	document.getElementById("closeApp").addEventListener("click",closePopup);
	
	
	window.addEventListener('tizenhwkey', function(ev) {
		if (ev.keyName === "back") {
			var activePopup = document.querySelector('.ui-popup-active'),
				page = document.getElementsByClassName('ui-page-active')[0],
				pageid = page ? page.id : "";

			if ((pageid === "mainPage" && !activePopup) || popup_shown===true) {
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
	//launch service app
	launchServiceApp();
	     
};






