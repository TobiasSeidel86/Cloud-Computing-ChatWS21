var messages = document.getElementById('messages');
var form = document.getElementById('form');
var sendData = document.getElementById('sendData');
var sendFile = document.getElementById("sfile");

socket.on('chat message', function (msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});


socket.on('messageToAll', function (msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    item.style.color = "white";
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

//creates an up-to-date list of all online users
socket.on('refreshOnlineUsers', function (online) {
    let onlineUserMap = new Map(online)
    var userList = document.getElementById('userList');
    userList.innerHTML = " ";
    for (let iterator of onlineUserMap.entries()) {
        var key = iterator[0];
        var name = iterator[1];
        var itemCheck = document.createElement('input');
        itemCheck.type = "checkbox";
        itemCheck.id = key.toString();
        itemCheck.value = name.toString();
        var itemLabel = document.createElement('label');
        itemLabel.for = name.toString()
        itemLabel.textContent = name.toString();
        itemLabel.style.color = "white";
        userList.appendChild(itemCheck);
        userList.appendChild(itemLabel);
        userList.appendChild(document.createElement('br'));
    }
});

form.addEventListener('submit', function (e) {
    var userList = $("#userList input")
    var privateChatUsers = getSelectedUsers()

    e.preventDefault();
    if (input.value) {
        var message = {
            recip: privateChatUsers,
            msg: input.value
        }
        socket.emit('chat message', message);
        input.value = '';
    }
    sendMedia ();
});

function getSelectedUsers() {
    var privateChatUsers = new Array();
    for (const userListElement of userList) {
        if (userListElement.checked) {
            privateChatUsers.push(userListElement.id);
        }
    }
    return privateChatUsers;
}

//user want to upload and send a media file
 function sendMedia () {
    var file = document.getElementById("fileUpload").files[0];
    var timestamp = new Date();
    var reader = new FileReader();
    var username = authentication.userName;

    var message = timestamp.getHours() + ':' + timestamp.getMinutes() + ' ' + username + ': ';
    input.value = "";

    //matching the type of data
    reader.onload = function () {
        if (file.type.match('image.*')) {
            socket.emit("media", {
                type: "image",
                msg: message,
                data: reader.result,
                recip: Array.from(getSelectedUsers())
            });
        } else if (file.type.match('video.*')) {
            socket.emit("media", {
                type: "video",
                msg: message,
                data: reader.result,
                recip: Array.from(getSelectedUsers())
            });
        } else if (file.type.match('audio.*')) {
            socket.emit("media", {
                type: "audio",
                msg: message,
                data: reader.result,
                recip: Array.from(getSelectedUsers())
            });
        } else {
            socket.emit("media", {
                type: "other",
                msg: message,
                data: reader.result,
                recip: Array.from(getSelectedUsers())
            });
        }
    }
    if (file) {
        reader.readAsDataURL(file);
    }

    // Reset uploaded file.
    let list = new DataTransfer();
    document.getElementById("fileUpload").files = list.files;

}

//Case decision for receiving data
socket.on("media", function (file) {
    var item = document.createElement('li');
    var media;
    item.textContent = file.msg;

    //for video files
    if (file.type == "video") {
        media = document.createElement('video');
        media.setAttribute('class', 'video-small');
        media.setAttribute('controls', 'controls');
        media.height = "300";
        media.src = file.data;
    }

    //for images
    else if (file.type == "image") {
        media = document.createElement('img');
        media.height = "300";
        media.src = file.data;
    }

    //Audio
    else if (file.type == "audio") {
        media = document.createElement('audio');
        media.setAttribute('controls', 'controls');
        media.src = file.data;
    }

    //for all other Media, create a download link
    else {
        media = document.createElement('a');
        media.setAttribute('download', 'download');
        media.href = file.data;
        media.textContent = "Dowload Data";
        media.style.background = "#f5f5dc"
        media.style.paddingRight = "10px";
        media.style.paddingLeft = "10px";
    }

    media.style.marginLeft = "6px";
    item.append(media);
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});