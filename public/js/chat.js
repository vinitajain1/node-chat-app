const socket = io();

//Elements
const $messageForm = document.getElementById("chat-form");
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $shareLocationButton = document.querySelector("#share-location");
const $messages = document.querySelector("#messages");


//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options
const { username,room } = Qs.parse(location.search, {ignoreQueryPrefix: true});

socket.on("message",(message)=>{
        const html = Mustache.render(messageTemplate,{
            message: message.text,
            createdAt: moment(message.createdAt).format('h:mm a'),
            username:message.username
            });
        $messages.insertAdjacentHTML('beforeend',html);
    });



socket.on("locationMessage",(url)=>{
        const html = Mustache.render(locationTemplate,{
            url:url.url,
            createdAt:moment(url.createdAt).format('h:mm a'),
            username:url.username
            });
        $messages.insertAdjacentHTML('beforeend',html);
    });



$shareLocationButton.addEventListener("click",()=>{
    if(!navigator.geolocation){
        return alert("Geolocation is not supported by your browser")
    }

    $shareLocationButton.setAttribute("disabled","disabled");

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit("shareLocation",
        {latitude:position.coords.latitude,longitude:position.coords.longitude},
        ()=>{
            $shareLocationButton.removeAttribute("disabled");
            console.log("Location shared");
        });
    })
})



$messageForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    
    $messageFormButton.setAttribute('disabled','disabled');

    const message = $messageFormInput.value;

    socket.emit("chatMessage",message, (error)=>{
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value=''
        $messageFormInput.focus();
        if(error){
            return console.log(error);
        }
        console.log("Message delivered");
    });
});

socket.on('roomData', ({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    });
    document.querySelector("#sidebar").innerHTML = html;
});

socket.emit("join",{ username, room },(error)=>{
    if(error){
        alert(error);
        location.href = '/'
    }
})