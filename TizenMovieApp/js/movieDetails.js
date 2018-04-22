/**
 * 
 */

//base url of poster
var image_url='https://image.tmdb.org/t/p/w370_and_h556_bestv2';
var id=sessionStorage.getItem("page");
//getting the movie details
var s=sessionStorage.getItem(id).split("$$$$");
var genres="";
gen=s[4].split(",");
genres=sessionStorage.getItem("g"+gen[0]);
for(var i=1;i<gen.length;i++)
	{
	genres=genres+", "+sessionStorage.getItem("g"+gen[i]);
	}

//updating the movie details
document.getElementById("poster").setAttribute("src",image_url+s[1]);
document.getElementById("genre").innerHTML=genres;
document.getElementById("release").innerHTML=s[2];
document.getElementById("overview").innerHTML=s[3];
document.getElementById("title").innerHTML=s[0];


