


showNiceName() ;




//显示通用
function showCurrency(data, id) {
	if(data == null || data == '' || data == 'undefined') {
		id.innerHTML = '<span style="color:red;font-size: 14px;" class="mui-pull-right">未设置</span>';
	} else {
		id.innerText = data;
	}
}

//显示用户昵称
function showNiceName() {
	var data = app.getUserinfo().niceName;
	var niceName=document.getElementById("updateNiceName");
	showCurrency(data, niceName);
	
}

//显示密码,为保证安全，如有密码，只显示“已设置”
function showPwd() {
	var data = app.getUserinfo().password;
	console.log("pwd:" + data)
	showCurrency(data, pwd);
}

//显示用户手机号码
function showPhoneNumber() {
	var data = app.getUserinfo().phoneNumber;
	showCurrency(data, phoneNumber);
}

//显示用户邮箱
function showEmail() {
	var data = app.getUserinfo().email;
	showCurrency(data, email);
}