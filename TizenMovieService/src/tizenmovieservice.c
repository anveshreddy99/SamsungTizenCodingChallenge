#include <tizen.h>
#include <service_app.h>
#include "tizenmovieservice.h"
#include <dlog.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <curl/curl.h>
#include <message_port.h>
#include <net_connection.h>


struct string {
  char *ptr;
  size_t len;
};

// base urls for now showing, upcoming and genres, actual url's are formed based on commands from the web app
char* movie_url= "https://api.themoviedb.org/3/movie/%s?api_key=2fb94b4c526128abacc00433ad6190b6&language=en-US&page=%s";
char* genre_url= "https://api.themoviedb.org/3/genre/movie/list?language=en-US&api_key=2fb94b4c526128abacc00433ad6190b6";
int ret;


void init_string(struct string *s) {
  s->len = 0;
  s->ptr = malloc(s->len+1);
  if (s->ptr == NULL) {
    fprintf(stderr, "malloc() failed\n");
    exit(EXIT_FAILURE);
  }
  s->ptr[0] = '\0';
}

size_t writefunc(void *ptr, size_t size, size_t nmemb, struct string *s)
{
  size_t new_len = s->len + size*nmemb;
  s->ptr = realloc(s->ptr, new_len+1);
  if (s->ptr == NULL) {
    fprintf(stderr, "realloc() failed\n");
    exit(EXIT_FAILURE);
  }
  memcpy(s->ptr+s->len, ptr, size*nmemb);
  s->ptr[new_len] = '\0';
  s->len = new_len;

  return size*nmemb;
}



bool service_app_create(void *data)
{
    // Todo: add your code here.
    return true;
}

void service_app_terminate(void *data)
{
    // Todo: add your code here.
    return;
}

//send data to web app
void send_message(bundle *b)
{

	ret = message_port_send_message("6yEMPL4uwI.TizenMovieApp", "WEB_APP_PORT", b);
    if (ret != MESSAGE_PORT_ERROR_NONE)
		dlog_print(DLOG_ERROR, LOG_TAG , "message_port_check_remote_port error start signal: %d", ret);
    else
    	dlog_print(DLOG_INFO, LOG_TAG, "Send message done start signal");
	bundle_free(b);

}


/*sending the response to the web app
 * Since we cannot send longer messages at a time (getting port error due to message size exceeded error)
 * So I broke the message into chunks(10000 size) and send to web app
 * Start and end strings are used to indicate the start and end of message sending for a json response
 */
void send_data_to_webApp(char* command, char *data)
{

	 bundle *b = bundle_create();
	 int length = strlen(data);
	 int chunks = length / 10000;
	 int start_index;
	 int end_index;
	 int i;
	 //start signal
	 if(strcmp(data,"Error")==0)
	 {
		 bundle_add_str(b, command, "Error");
		 send_message(b);
	     free(data);
	     return;
	 }
	 bundle_add_str(b, command, "start");
	 send_message(b);
	   //break into chunks of size 10000 and send data
	 for(i = 0; i<= chunks; i++)
	 {
		 start_index = (10000*i);
	     end_index = start_index+10000<length ? 10000 : (length-start_index);
	     char *data_to_send = (char*) malloc(end_index+1);
	     strncpy(data_to_send, data+start_index, end_index);
	     data_to_send[end_index] = '\0';
	     b = bundle_create();
	     bundle_add_str(b,command, data_to_send);
	     send_message(b);
	     free(data_to_send);
	 }

	 b = bundle_create();
	 bundle_add_str(b,command, "end");
	 send_message(b);

}



/*Read the command and form a url for upcoming or now playing movies or for genres.
 * Send a request to server for getting the data specific to the command
 */
void curl_request(char* command ,char *data)
{
	CURL *curl;
    CURLcode res;
    curl = curl_easy_init();
    char request_url[2000];
    static connection_h connection;
    int error_code;
    //check network connection
    error_code = connection_create(&connection);
    if (error_code != CONNECTION_ERROR_NONE)
    {
    	send_data_to_webApp(command,"Error");
    	connection_destroy(connection);
        return;
    }
    connection_destroy(connection);

    //URl formation
    if(strcmp(command,"playing_now")==0)
    {
    	sprintf(request_url,movie_url,"now_playing",data);
    }

    else if(strcmp(command,"genre")==0)
    {
    	strcpy(request_url,genre_url);
    }
    else if(strcmp(command,"upcoming_movies")==0)
    {
    	sprintf(request_url,movie_url,"upcoming",data);

    }

    if(curl)
    {
        struct string s;
        init_string(&s);
        curl_easy_setopt(curl, CURLOPT_URL, request_url);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, writefunc);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &s);
        res = curl_easy_perform(curl);
        if (res != CURLE_OK)
        {
        	send_data_to_webApp(command,"Error");
        	return;
        }

        send_data_to_webApp(command,s.ptr);
        free(s.ptr);
        free(request_url);
        curl_easy_cleanup(curl);
      }
}



//Local message port callback function
void message_port_cb(int local_port_id, const char *remote_app_id, const char *remote_port,
                bool trusted_remote_port, bundle *message, void *user_data)
{
    char *command = NULL;
    char *data = NULL;
    bundle_get_str(message, "command", &command);
    bundle_get_str(message, "data", &data);
    curl_request(command,data);
    dlog_print(DLOG_INFO, LOG_TAG, "Message from %s, command: %s data: %s",remote_app_id, command, data);
}



void service_app_control(app_control_h app_control, void *data)
{
    // Register local message port to receive messages
	int port_id = message_port_register_local_port("SERVICE_PORT", message_port_cb, NULL);
	if (port_id < 0)
	    dlog_print(DLOG_ERROR, LOG_TAG, "Port register error: %d", port_id);
	else
	    dlog_print(DLOG_INFO, LOG_TAG, "port_id: %d", port_id);
    return;
}

static void
service_app_lang_changed(app_event_info_h event_info, void *user_data)
{
	/*APP_EVENT_LANGUAGE_CHANGED*/
	return;
}

static void
service_app_region_changed(app_event_info_h event_info, void *user_data)
{
	/*APP_EVENT_REGION_FORMAT_CHANGED*/
}

static void
service_app_low_battery(app_event_info_h event_info, void *user_data)
{
	/*APP_EVENT_LOW_BATTERY*/
}

static void
service_app_low_memory(app_event_info_h event_info, void *user_data)
{
	/*APP_EVENT_LOW_MEMORY*/
}

int main(int argc, char* argv[])
{
    char ad[50] = {0,};
	service_app_lifecycle_callback_s event_callback;
	app_event_handler_h handlers[5] = {NULL, };

	event_callback.create = service_app_create;
	event_callback.terminate = service_app_terminate;
	event_callback.app_control = service_app_control;


	service_app_add_event_handler(&handlers[APP_EVENT_LOW_BATTERY], APP_EVENT_LOW_BATTERY, service_app_low_battery, &ad);
	service_app_add_event_handler(&handlers[APP_EVENT_LOW_MEMORY], APP_EVENT_LOW_MEMORY, service_app_low_memory, &ad);
	service_app_add_event_handler(&handlers[APP_EVENT_LANGUAGE_CHANGED], APP_EVENT_LANGUAGE_CHANGED, service_app_lang_changed, &ad);
	service_app_add_event_handler(&handlers[APP_EVENT_REGION_FORMAT_CHANGED], APP_EVENT_REGION_FORMAT_CHANGED, service_app_region_changed, &ad);

	return service_app_main(argc, argv, &event_callback, ad);
}
