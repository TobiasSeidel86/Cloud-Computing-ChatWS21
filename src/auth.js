class Authentication {

    loginPopup = document.getElementById("loginPopup");
    chatEnabled = false;
    userName;
    mySocketId;

    init() {
        var thiz = this;

        //send username and password to server
        loginPopup.addEventListener('submit', function (e) {
            e.preventDefault();
            let username = document.getElementById("username");
            let password = document.getElementById("password");
            if (username.value && password.value) {
                socket.emit('login', {userName: username.value, password: password.value});
            }
        });

        //Response from the server
        socket.on("loginResult", function (loginResult) {
            // If the login is successful then close the login popup and
            // allow sending messages and execute the join message to all.
            if (loginResult.loginSuccessful) {
                loginPopup.style.visibility = "hidden";
                document.getElementById('form').style.visibility = "visible";
                thiz.chatEnabled = true;
                thiz.userName = loginResult.userName;
                thiz.mySocketId = loginResult.mySocketId;
                socket.emit("join", loginResult.userName.toString())
            }

            //if login are failed create a alert messagebox
            else {
                alert("User already assigned or password incorrect.")
            }
        });
    }
}