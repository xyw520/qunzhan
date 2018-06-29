/**
 * 演示程序当前的 “注册/登录” 等操作，是基于 “本地存储” 完成的
 * 当您要参考这个演示程序进行相关 app 的开发时，
 * 请注意将相关方法调整成 “基于服务端Service” 的实现。
 **/
(function($, app) {

	//常用正则表达式
	app.Reg = {};
	app.Reg.MODULE_NAME = /([\w-]+)\.html/; //匹配模块名
	app.Reg.HTTP_URL = /^((https|http)?:\/\/)/; //校验http url
	app.Reg.IS_MOBILE = /^1[3|4|5|7|8]\d{9}$/; //手机号码
	app.Reg.EMAIL = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
	

	app.config = {
		isDebug: true, //是否调试模式，发布时为false（发布时一定要改为false）
		serverHost: 'http://103.43.11.90:888', //API服务器域名
		dbName: 'qunzhanDb', //本地存储数据库名称
		basicAuthorization: 'Basic YXBwLXF1bnpoYW46YXBwNjBmNzg2ODFkMDYzNTkwYTQ2OWYxYjI5N2ZlZmYzYzQ=',
		SMS: {
			upperlimit: 3, //找回密码短信发送次数上限
			seconds: 60 //发送间隔时间
		}
	};

	/**
	 * 日志打印
	 */
	app.log = function() {
		if(app.config.isDebug && console) {
			for(var key in arguments) {
				if(mui.isObject(arguments[key])) {
					arguments[key] = JSON.stringify(arguments[key]);
				}
			}
			console.log.apply(console, arguments);
		}
	};

	//所有API url
	app.api = {
		//用户登录
		'userLogin': '/authentication/form', //用户oauth登录
		//获取用户基本信息
		'getUserInfo': '/user/me',
		//用户名验证
		'checkAccout': '/user/username?username=',
		//邮箱验证
		'checkEmail': '/user/email?email=',
		//注册
		'userReg': '/user/register',
		//手机号  发送验证码给手机
		'regPhoneNumberSend': '/user/registerPhoneNumberSend?phoneNumber=',
		//手机号  手机输入接受到的验证码进行验证
		'registerPhoneNumberValid': '/user/registerPhoneNumberValid?code=',
		//手机号  注册
		'registerPhoneNumber': '/user/registerPhoneNumber',
		//手机号登录
		'loginPhoneNumber': '/authentication/mobile',
		//手机号登录  发送验证码
		'loginPhoneNumberSend': '/code/sms?mobile=',
		//昵称修改
		'updateNiceName': '/user/update/niceName',
		//密码修改
		'updatePwdNew': '/user/update/password/new',
		//密码修改,存在老密码情况
		'updatePwd': '/user/update/password',
		//邮箱修改
		'updateEmail': '/user/update/email',
		//用户名修改
		'updateUserName': '/user/update/username/',
		//修改手机号（已有号码） 发送验证码
		'hasSend': '/user/update/phoneNumberRest/send',
		//修改手机号（已有号码） 效验验证码
		'hasValid': '/user/update/phoneNumberRest/valid',
		//修改手机号  新手机号发送验证码
		'newPhoneSend': '/user/update/phoneNumberRest/send/newPhoneNumber',
		//修改手机号  新手机号效验验证码
		'newPoneValid': '/user/update/phoneNumberRest/valid/newPhoneNumber',
		//[手机号未绑定情况下] 新的手机号 发送验证码
		'noHasSend': '/user/update/phoneNumber/send',
		//[手机号未绑定情况下] 新的手机号 效验验证码
		'noHasValid': '/user/update/phoneNumber/valid',
		//图像上传
		'imgUpload': '/file/upload/avatar',
		//头像修改
		'updateHeadImg':'/user/update/avatar',
		//手机号码修改
		'phoneNumberRest': '/user/update/phoneNumberRest',
		//手机号码修改  手机号没有绑定的情况下
		'phoneNumber':'/user/update/phoneNumber',
		//		//新的手机号码，发送验证码
		//		'newPhoneNumberRestSend':'/user/update/phoneNumberRest/send/',
		//json header
		//用户添加新站点
		'addSite':'/cms/site/add',
		//用户修改站点
		'updateSite':'/cms/site/update',
		//获取当前用户的站点列表
		'siteList':'/cms/site/list',
		//检查域名是否被占用
		'siteUsed':'/cms/site/domain/used',
		//获取创建新站点系统分配的排序号
		'addSiteOrderNum':'/cms/site/orderNum',
		
		
		
		'json': {
			'Content-Type': 'application/json'
		}

	};

	//若api接口不是以http或者https开头，则拼接配置中的apiDomain为开头
	for(var i in app.api) {
		if(!app.Reg.HTTP_URL.test(app.api[i])) app.api[i] = app.config.serverHost + app.api[i];
	}

	/**
	 * 显示等待框
	 * @param {String} message
	 */
	app.showWaiting = function(message) {
		if(window.plus) {
			return plus.nativeUI.showWaiting(message || '请稍候...');
		}
	};

	/**
	 * 关闭等待框
	 */
	app.closeWaiting = function(waitingObj) {
		if(window.plus)(waitingObj && waitingObj.close()) || plus.nativeUI.closeWaiting();
	};

	app.ajax = function(setting) {
		var token = app.getState().token;
		token = token || '';
		var defaultHeaders = {
			'Authorization': token
			//			'content-type':'application/x-www-form-urlencoded'
		};
		var defaultSetting = {
			//是否展示等待框  （自定义） 默认不显示
			showWaiting: setting.showWaiting || false,

			//发送同步请求
			async: setting.async || false,

			//强制使用5+跨域
			crossDomain: setting.crossDomain || true,

			//请求方式，目前仅支持'GET'和'POST'，默认为'GET'方式
			type: setting.type || "POST",

			//发送到服务器的业务数据
			data: setting.data || {},

			//预期服务器返回的数据类型；如果不指定，mui将自动根据HTTP包的MIME头信息自动判断；支持设置的dataType可选值：{xml , html , script , json ,text }
			dataType: setting.dataType || "json",

			//请求超时时间（毫秒），默认值为15秒，0表示永不超时；若超过设置的超时时间(非0的情况)，依然未收到服务器响应，则触发error回调
			timeout: setting.timeout || 10000,

			//headers Type: Json 指定HTTP请求的Header
			headers: setting.headers || defaultHeaders,

			//请求成功时触发的回调函数，该函数接收三个参数：
			//data：服务器返回的响应数据，类型可以是json对象、xml对象、字符串等；
			//textStatus：状态描述，默认值为'success'
			//xhr：xhr实例对象
			//success : setting.success 
			success: function(data, textStatus, xhr) {
				console.log('返回数据:' + JSON.stringify(data));
				console.log('返回textStatus:' + textStatus);
				//				console.log('xhr'+JSON.stringify(xhr));
				switch(data.status) {
					case 200:
						app.log("data.status 200。。。");
						mui.isFunction(setting.success) && setting.success(data);
						break;
					case 401: //无权访问	
						mui.isFunction(setting.success) && setting.success(data);
						break;
					case 402: //未登录
						mui.isFunction(setting.success) && setting.success(data);
						break;
					case 407: //token自动续期
						break;
					default:
						if(data.message != '访问过于频繁')
							//							if(!data.valid) {
							//								mui.isFunction(setting.success) && setting.success(data);
							//							}
							mui.toast("default:" + data.message);  
						app.log("default:" + data.message);
						app.log("default:" + JSON.stringify(data));
						mui.isFunction(setting.error) && setting.error(data);
						break;
				}
			},
			//请求失败时触发的回调函数，该函数接收三个参数：
			//xhr：xhr实例对象
			//type：错误描述，可取值："timeout", "error", "abort", "parsererror"、"null"
			//errorThrown：可捕获的异常对象
			error: function(xhr, type, errorThrown) {
				app.log("send xhr：" + xhr.status);
				app.log("send xhr：" + xhr.statusText);
				app.log("send xhr：" + xhr.responseText);
				app.log("send type：" + type);
				app.log("send errorThrown：" + errorThrown);
				var errorMsg = {
					'timeout': '请求超时，请稍后再试！',
					'error': '未知错误',
					'abort': '网络或服务器已断开',
					'parsererror': '解析错误'
				};
				if(type != 'abort') mui.toast((errorMsg[type] || 'ajax出错了'));
				if(typeof setting.error == 'function') setting.error(xhr, type, errorThrown);
			},
			//义 完成后调用
			complete: function(xhr, status) {
				app.log("app.ajax complete。。。:" + setting.showWaiting);
				if(setting.showWaiting && setting.closeWaiting != false) {
					app.closeWaiting();
				}
				var resp = xhr.response;
				/*if(status === 'success' && defaultSetting.dataType.toLowerCase() === 'json') {
					resp = JSON.parse(resp);
				}*/
				if(typeof setting.complete == 'function') setting.complete(resp);
			}

		}
		//发送请求之前调用
		setting.beforeSend && (defaultSetting.beforeSend = setting.beforeSend);
		app.log("defaultSetting.headers:" + JSON.stringify(defaultSetting.headers));
		app.log("app.ajax send。。。:" + JSON.stringify(defaultSetting));
		//在发送之前设置等待框
		if(setting.showWaiting) app.showWaiting(typeof setting.showWaiting === 'string' ? setting.showWaiting : undefined);
		//调用 mui ajax 正式发送请求
		mui.ajax(setting.url, defaultSetting);
	};

	app.login = function(loginInfo, callback) {
		callback = callback || $.noop;
		loginInfo = loginInfo || {};
		loginInfo.account = loginInfo.account || '';
		loginInfo.password = loginInfo.password || '';
		loginInfo.imageCode = loginInfo.imageCode || '';
		if(loginInfo.account.length < 5) {
			return callback('账号最短为 5 个字符');
		}
		if(loginInfo.password.length < 6) {
			return callback('密码最短为 6 个字符');
		}
		if(loginInfo.imageCode.length < 6) {
			return callback('验证码最短为 6 个字符');
		}
		var authed = false;
		app.log("username:" + loginInfo.account + " password:" + loginInfo.password + " imageCode:" + loginInfo.imageCode);
		app.ajax({
			url: app.api['userLogin'],
			showWaiting: true,
			data: {
				username: loginInfo.account,
				password: loginInfo.password,
				imageCode: loginInfo.imageCode
			},
			//登录特定 headers
			headers: {
				'Authorization': app.config.basicAuthorization,
				'Content-Type': 'application/x-www-form-urlencoded',
				'deviceId': plus.device.uuid
			},
			type: 'post', //HTTP请求类型

			success: function(data) {
				if(data.status == 200) {
					//保存auth信息
					app.setAuthinfo(data.data);
					//保存 state 信息
					var state = app.getState();
					state.account = loginInfo.account;
					state.token = data.data.token_type + " " + data.data.access_token;
					app.setState(state);
					app.log("state save ok");
					//回调
					return callback();
				} else {
					callback(data.message);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("xhr:" + xhr + " -type:" + type + " -errorThrown:" + errorThrown);
			}
		});

	};
	
	/*
	 * 添加站点
	 */
	app.addSite=function(siteInfo,callback){
		
		app.log(siteInfo.name);
		
		app.ajax({
			url: app.api['addSite'],
			data:{
				orderNum:siteInfo.orderNum,
				name:siteInfo.name,
				domain:siteInfo.domain,
				seoTitle:siteInfo.seoTitle,
				seoKeywords:siteInfo.seoKeywords,
				seoDescription:siteInfo.seoDescription,
				template:siteInfo.template,
				wap:siteInfo.wap,
				ip:siteInfo.ip,
				isOn:siteInfo.isOn,
				phoneNumber:siteInfo.phoneNumber,
				email:siteInfo.email,
				wap:siteInfo.wap,
				isOn:siteInfo.isOn
			},
			showWaiting: true,
			type: 'post', //HTTP请求类型
			dataType: 'json',
			success: function(data) {
				app.log("data:"+JSON.stringify(data));
				return callback(data);
			},
			error: function(xhr, type, errorThrown) {
				app.log("xhr:" + xhr + " -type:" + type + " -errorThrown:" + errorThrown);
			}
		});
	}
	
	/*
	 * 修改站点
	 */
	app.updateSite=function(siteInfo,callback){
		app.ajax({
			url: app.api['updateSite'],
			data:{
				id:siteInfo.id,
				orderNum:siteInfo.orderNum,
				name:siteInfo.name,
				domain:siteInfo.domain,
				seoTitle:siteInfo.seoTitle,
				seoKeywords:siteInfo.seoKeywords,
				seoDescription:siteInfo.seoDescription,
				template:siteInfo.template,
				wap:siteInfo.wap,
				ip:siteInfo.ip,
				isOn:siteInfo.isOn,
				phoneNumber:siteInfo.phoneNumber,
				email:siteInfo.email,
				wap:siteInfo.wap,
				isOn:siteInfo.isOn
			},
			showWaiting: true,
			type: 'post', //HTTP请求类型
			dataType: 'json',
			success: function(data) {
				app.log("data:"+JSON.stringify(data));
				return callback(data);
			},
			error: function(xhr, type, errorThrown) {
				app.log("xhr:" + xhr + " -type:" + type + " -errorThrown:" + errorThrown);
			}
		});
	}
	
	/*
	 * 获取当前用户的站点列表
	 */
	app.siteList=function(callback){
		app.ajax({
			url:app.api['siteList'],
			type:'get',
			success: function(data) {
				app.log("data:"+JSON.stringify(data));
				siteinfo=app.getSiteInfo();
				siteinfo=data.data;
				app.setSiteInfo();
				return callback(siteinfo);
			},
			error: function(xhr, type, errorThrown) {
				app.log("xhr:" + xhr + " -type:" + type + " -errorThrown:" + errorThrown);
			}
		});
	}
	/*
	 * 添加站点时检测站点是否被占用
	 */
	app.addsiteUsed=function(domain,callback){
		app.ajax({
			url:app.api['siteUsed'],
			type:'post',
			data:{
				domain:domain
			},
			error: function(xhr, type, errorThrown) {
				app.log("xhr:" + JSON.stringify(xhr)  + " -type:" + type + " -errorThrown:" + errorThrown);
				if(xhr.valid==false){
					return callback(xhr.message);
				}
			}
		});
	}
	
	
	/*
	 * 修改站点时检测站点是否被占用
	 */
	app.updatesiteUsed=function(domain,olddomain,callback){
		app.ajax({
			url:app.api['siteUsed'],
			type:'post',
			data:{
				domain:domain,
				domainOld:olddomain
			},

			error: function(xhr, type, errorThrown) {
				app.log("xhr:" + JSON.stringify(xhr)  + " -type:" + type + " -errorThrown:" + errorThrown);
				if(xhr.valid==false){
					return callback(xhr.message);
				}
			}
		});
	}
	
	/*
	 * 获取创建新站点系统分配的排序号
	 */
	app.addSiteOrderNum=function(callback){
			app.ajax({
			url:app.api['addSiteOrderNum'],
			type:'get',
			success: function(data) {
				app.log("排序号data:"+JSON.stringify(data));
				return callback(data);
			},
			error: function(xhr, type, errorThrown) {
				app.log("排序号xhr:" + xhr + " -type:" + type + " -errorThrown:" + errorThrown);
			}
		});
	}
	/*
	 * 输入框正则验证	 				
	 */
	app.checkMyBox = function(reg, box, callback) {
		var regex = new RegExp(reg);
		if(!regex.test(box.value)) {
			box.value = '';
			return callback('格式有误');
		} else {
			return callback();
		}
	};

	/*
	 * 手机号注册  发送验证码给手机
	 */
	app.regPhoneNumberSend = function(phoneNumber, callback) {
		callback = callback || $.noop;
		phoneNumber = phoneNumber || '';
		app.ajax({
			url: app.api['regPhoneNumberSend'] + phoneNumber + '&deviceId=' + plus.device.uuid,
			showWaiting: true,
			type: 'get', //HTTP请求类型
			success: function(data) {
				//保存手机号码到本地
				var phone = app.getPhone();
				phone = phoneNumber;
				app.setPhone(phone);
				//回调
				return callback(data);
			},
			error: function(xhr, type, errorThrown) {
				//				if(errorThrown) {
				//					plus.nativeUI.toast("请检查您的网络是否连接");
				//				}
				//				plus.nativeUI.toast("xhr:" + xhr + " -type:" + type + " -errorThrown:" + errorThrown);
			}
		});
	};

	/*
	 * 手机号注册  手机输入接受到的验证码进行验证
	 */
	app.regPhoneNumberValid = function(validCode, callback) {
		callback = callback || $.noop;
		validCode = validCode || '';
		app.ajax({
			url: app.api['registerPhoneNumberValid'] + validCode + '&phoneNumber=' + app.getPhone() + '&deviceId=' + plus.device.uuid,
			showWaiting: true,
			type: 'get', //HTTP请求类型
			success: function(data) {
				//保存验证码到本地
				var valid = app.getValid();
				valid = validCode;
				app.setValid(valid);

				return callback(data);
			}
		});
	};

	/*
	 * 手机号  注册，最后一步，输入昵称即可注册成功
	 */
	app.regPhoneNumber = function(niceName, callback) {
		callback = callback || $.noop;
		niceName = niceName || '';
		var info = {
			"code": app.getValid(),
			"deviceId": plus.device.uuid,
			"niceName": niceName,
			"phoneNumber": app.getPhone()
		};
		app.ajax({
			url: app.api['registerPhoneNumber'],
			//			headers: app.api['json'],
			headers: {
				'Content-Type': 'application/json'
			},
			showWaiting: true,
			type: 'post', //HTTP请求类型
			dataType: 'json',
			data: JSON.stringify(info),
			success: function(data) {
				return callback(data);
			},
			error: function(xhr, type, errorThrown) {
				//alert("xhr:" + xhr + " -type:" + type + " -errorThrown:" + errorThrown);
			}
		});
	};

	/*
	 * 手机号  登录，发送验证码
	 */
	app.loginPhoneNumberSend = function(phoneNumber, callback) {
		callback = callback || $.noop;
		phoneNumber = phoneNumber || '';
		app.ajax({
			url: app.api['loginPhoneNumberSend'] + phoneNumber,
			//登录特定 headers
			headers: {
				'deviceId': plus.device.uuid
			},
			showWaiting: true,
			type: 'get', //HTTP请求类型						
			success: function(data) {
				return callback(data);
			},
			error: function(xhr, type, errorThrown) {
				//				alert("xhr:" + xhr + " -type:" + type + " -errorThrown:" + errorThrown);
			}
		});
	};

	/*
	 * 手机号  登录，输入接收到的验证码即可登录
	 */
	app.loginPhoneNumber = function(phoneNumber, smsCode, callback) {
		callback = callback || $.noop;
		phoneNumber = phoneNumber || '';
		smsCode = smsCode || '';

		app.ajax({
			url: app.api['loginPhoneNumber'],
			//登录特定 headers
			headers: {
				'Authorization': app.config.basicAuthorization,
				'Content-Type': 'application/x-www-form-urlencoded',
				'deviceId': plus.device.uuid
			},
			showWaiting: true,
			type: 'post', //HTTP请求类型			
			data: {
				smsCode: smsCode,
				mobile: phoneNumber,
			},
			success: function(data) {
				if(data.status == 200) {
					console.log('ok');
					//保存auth信息
					app.setAuthinfo(data.data);
					//保存 state 信息
					var state = app.getState();
					state.account = phoneNumber;
					state.token = data.data.token_type + " " + data.data.access_token;
					app.setState(state);
					app.log('token:' + state.token);
					app.log("state save ok");
					//回调
					return callback(data);
				} else {
					callback(data.message);
				}
			},
			error: function(xhr, type, errorThrown) {
				//alert("xhr:" + xhr + " -type:" + type + " -errorThrown:" + errorThrown);
			}
		});
	};

	/**
	 * 登录成功后获取个人信息
	 * @param {Object} callback
	 */
	app.loadUserInfo = function(callback) {
		var token = app.getState().token;
		app.log("token:" + token);
		app.ajax({
			url: app.api['getUserInfo'],
			type: 'get', //HTTP请求类型
			showWaiting: true,
			success: function(data) {
				if(data.status == 200) {
					//保存用户信息
					app.setUserinfo(data.data);
					app.log("保存用户信息成功：" + JSON.stringify(data.data));
					return callback();
				} else {
					return callback(data.message);
				}
			}
		});
	};

	/*
	 * 邮箱修改
	 */
	app.updateEmail = function(newEmail, callback) {
		app.ajax({
			url: app.api['updateEmail'],
			type: 'post',
			showWaiting: true,
			data: {
				email: newEmail
			},
			success: function(data) {
				app.log("data:" + JSON.stringify(data))
				if(data.status == 200) {
					//更新用户新昵称到本地
					var userinfo = app.getUserinfo();
					userinfo.email = newEmail;
					app.setUserinfo(userinfo);
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("邮箱修改失败" + xhr + "::" + type + "::" + errorThrown);
			}
		});
	}

	/*
	 * 账号修改
	 */
	app.updateUserName = function(newAccount, callback) {
		var token = app.getState().token;
		app.log("昵称修改操作token:" + token);
		app.ajax({
			url: app.api["updateUserName"],
			data: {
				username: newAccount,
			},
			type: 'post',
			headers: {
				'Authorization': token,
			},
			showWaiting: true,
			success: function(data) {
				if(data.status == 200) {
					//更新用户新昵称到本地
					var userinfo = app.getUserinfo();
					userinfo.username = newAccount;
					app.setUserinfo(userinfo);
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("修改失败" + xhr + "::" + type + "::" + errorThrown);
			}
		});
	}

	/*
	 * 昵称修改
	 */
	app.updateNiceName = function(newName, callback) {
		app.log("newName:" + newName);
		var token = app.getState().token;
		app.log("昵称修改操作token:" + token);

		app.ajax({
			url: app.api["updateNiceName"],
			data: {
				niceName: newName,
			},
			type: 'post',
			headers: {
				'Authorization': token,
			},
			showWaiting: true,
			success: function(data) {
				if(data.status == 200) {
					//更新用户新昵称到本地
					var userinfo = app.getUserinfo();
					userinfo.niceName = newName;
					app.setUserinfo(userinfo);
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("昵称修改失败" + xhr + "::" + type + "::" + errorThrown);
			}
		});

		//				mui.ajax('http://192.168.1.200/user/update/niceName',{
		//					data: {
		//						niceName: 'sssssss'
		//					},
		//					type:'patch',
		//					headers: {
		//						'Authorization': 'bearer 81b44b6a-db8f-4dff-8b3a-091a82e463a1',
		//					},
		//					
		//					success: function(data) {
		//						// 请求成功
		//						app.log('--ok' + JSON.stringify(data));
		//						//更新用户新昵称到本地
		//						var userinfo = app.getUserinfo();
		//						userinfo.niceName = newName;
		//						app.setUserinfo(userinfo);
		//						return callback(data);
		//					},
		//					error: function(xhr, type, errorThrown) {
		//						// 请求失败
		//						app.log('--no:'+xhr+"::"+type+"::"+errorThrown)
		//					}
		//				});

		//		mui.ajax('http://server-name/login.php', 
		//		{
		//			data: {
		//				username: 'username',
		//				password: 'password'
		//			},
		//			dataType: 'json', //服务器返回json格式数据
		//			type: 'post', //HTTP请求类型
		//			timeout: 10000, //超时时间设置为10秒；
		//			headers: {
		//				'Content-Type': 'application/json'
		//			},
		//			success: function(data) {
		//				//服务器返回响应，根据响应结果，分析是否登录成功；
		//				...
		//			},
		//			error: function(xhr, type, errorThrown) {
		//				//异常处理；
		//				console.log(type);
		//			}
		//		});

	}

	/*
	 * 修改手机号（已有号码） 发送验证码
	 */
	app.hasSend = function(callback) {
		app.ajax({
			url: app.api['hasSend'],
			data: {
				deviceId: plus.device.uuid
			},
			type: 'get',
			showWaiting: true,
			success: function(data) {
				app.log('data:' + JSON.stringify(data));
				if(data.status == 200) {
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("失败");
			}
		});
	}

	/*
	 * 修改手机号（已有号码） 效验验证码
	 */
	app.hasValid = function(code, callback) {
		app.ajax({
			url: app.api['hasValid'],
			data: {
				deviceId: plus.device.uuid,
				code: code
			},
			type: 'get',
			showWaiting: true,
			success: function(data) {
				app.log('data:' + JSON.stringify(data));
				if(data.status == 200) {
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("失败");
			}

		});
	}

	/*
	 * 修改手机号 新手机号 发送验证码
	 */
	app.newPhoneSend = function(phone, callback) {
		console.log("修改手机号 新手机号 发送验证码  开始");
		app.ajax({
			url: app.api['newPhoneSend'],
			data: {
				deviceId: plus.device.uuid,
				phoneNumber: phone
			},
			type: 'get',
			showWaiting: true,
			success: function(data) {
				app.log('data:' + JSON.stringify(data));
				if(data.status == 200) {
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("失败");
			}
		});
	}
	/*
	 * 修改手机号 新手机号 效验验证码
	 */
	app.newPoneValid = function(phone, code, callback) {
		app.ajax({
			url: app.api['newPoneValid'],
			data: {
				deviceId: plus.device.uuid,
				phoneNumber: phone,
				code: code
			},
			type: 'get',
			showWaiting: true,
			success: function(data) {
				app.log('data:' + JSON.stringify(data));
				if(data.status == 200) {
					//保存新号码到本地用户信息
					var userinfo = app.getUserinfo();
					userinfo.phoneNumber = phone;
					app.setUserinfo(userinfo);
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("失败");
			}
		});
	}
	/*
	 * [手机号未绑定情况下]手机号绑定 发送验证码
	 */
	app.noHasSend = function(phone, callback) {
		app.ajax({
			url: app.api['noHasSend'],
			data: {
				deviceId: plus.device.uuid,
				phoneNumber: phone
			},
			type: 'get',
			showWaiting: true,
			success: function(data) {
				app.log('data:' + JSON.stringify(data));
				if(data.status == 200) {
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("失败");
			}
		});
	}
	/*
	 * [手机号未绑定情况下] 新的手机号 效验验证码
	 */
	app.noHasValid = function(phone, code, callback) {
		app.ajax({
			url: app.api['noHasValid'],
			data: {
				deviceId: plus.device.uuid,
				phoneNumber: phone,
				code: code
			},
			type: 'get',
			showWaiting: true,
			success: function(data) {
				app.log('data:' + JSON.stringify(data));
				if(data.status == 200) {
					//保存新号码到本地用户信息
					var userinfo = app.getUserinfo();
					userinfo.phoneNumber = phone;
					app.setUserinfo(userinfo);
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("失败");
			}
		});
	}
	/*
	 * 密码修改
	 */
	app.updatePwdNew = function(newPwd, callback) {
		app.log("密码修改操作开始");
		var token = app.getState().token;
		app.ajax({
			url: app.api['updatePwdNew'],
			data: {
				deviceId: plus.device.uuid,
				password: newPwd
			},
			type: 'post',
			showWaiting: true,
			success: function(data) {
				app.log('data:' + JSON.stringify(data));
				if(data.status == 200) {
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("失败");
			}
		});
	}

	/*
	 * 密码修改,存在老密码情况
	 */
	app.updatePwd = function(oldPwd, newPwd, callback) {
		app.log("密码修改操作开始");
		var token = app.getState().token;
		app.ajax({
			url: app.api['updatePwd'],
			data: {
				deviceId: plus.device.uuid,
				password: newPwd,
				passwordOld: oldPwd
			},
			type: 'post',
			showWaiting: true,
			success: function(data) {
				app.log('data:' + JSON.stringify(data));
				if(data.status == 200) {
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("失败");
			}
		});
	}

	/*
	 * 修改通用
	 */
	app.updateCurrency = function(updateItem, url, callback) {
		var token = app.getState().token;
		console.log(updateItem);
		app.ajax({
			url: url,
			type: 'PATCH',
			data: {
				email: updateItem
			},
			showWaiting: true,
			success: function(data) {
				if(data.status == 200) {
					app.log('修改：' + JSON.stringify(data));
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				app.log("修改失败" + xhr + "::" + type + "::" + errorThrown);
			}
		});
	}

	/*
	 * 手机号码修改
	 */
	app.phoneNumberRest = function(code,newPhoneNumber,callback) {
		app.ajax({
			url: app.api['phoneNumberRest'],
			type: 'post',
			showWaiting: true,
			data:{
				code:code,
				phoneNumber:newPhoneNumber,
				deviceId:plus.device.uuid
			},
			success: function(data) {
				app.log("手机号修改data:" + data);
				return callback(data);  
			},  
			error: function(xhr, type, errorThrown) {
				app.log("失败:" + xhr + "::" + type + "::" + errorThrown);
			}
		});  
	}
	
	/*
	 * 手机号修改  手机号没有绑定情况下
	 */
	app.phoneNumber=function(code, newPhoneNumber,callback){
		app.ajax({
			url: app.api['phoneNumber'],
			type: 'post',
			data:{
				code:code,
				phoneNumber:newPhoneNumber,
				deviceId:plus.device.uuid
			},
			showWaiting: true,
			success: function(data) {
				app.log("data:" + data);
				return callback(data);
			},
			error: function(xhr, type, errorThrown) {
				app.log("失败:" + xhr + "::" + type + "::" + errorThrown);
			}
		});
	}
	/*
	 * 
	 */

	/**
	 * 新用户注册,验证用户名是否已被注册
	 **/
	app.checkAccout = function(accout, callback) {
		callback = callback || $.noop;
		accout = accout || '';
		app.ajax({
			url: app.api['checkAccout'] + accout,
			showWaiting: true,
			//登录特定 headers
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			type: 'get', //HTTP请求类型
			//服务器没有返回规定的状态码
			//			success: function(data) {
			////				app.log("用户名是否已被注册:"+JSON.stringify(data));
			//				return callback(data);
			//			},
			error: function(data) {
				app.log("用户名是否已被注册:" + JSON.stringify(data));
				return callback(data);
			}

		});
	};

	/**
	 * 新用户注册,验证邮箱是否已被注册
	 **/
	app.checkEmail = function(email, callback) {
		callback = callback || $.noop;
		email = email || '';
		app.ajax({
			url: app.api['checkEmail'] + email,
			showWaiting: true,
			//登录特定 headers
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			type: 'get', //HTTP请求类型
			//服务器没有返回规定的状态码
			//			success: function(data) {
			//				app.log("用户名是否已被注册success:"+JSON.stringify(data));
			//				return callback(data);
			//			},
			error: function(data) {
				app.log("用户名是否已被注册error:" + JSON.stringify(data));
				return callback(data);
			}
		});
	};

	/**
	 * 新用户注册
	 **/
	app.reg = function(regInfo, callback) {
		callback = callback || $.noop;
		regInfo = regInfo || {};
		regInfo.account = regInfo.account || '';
		regInfo.password = regInfo.password || '';
		regInfo.niceName = regInfo.niceName || '未命名';
		regInfo.email = regInfo.email || '';
		app.log("email：" + regInfo.email);
		var regInfo = {
			"email": regInfo.email,
			"niceName": regInfo.niceName,
			"password": regInfo.password,
			"username": regInfo.account
		};
		app.ajax({
			url: app.api['userReg'],
			showWaiting: true,
			data: regInfo,
			//登录特定 headers
			headers: {
				'Content-Type': 'application/json'
			},
			type: 'post', //HTTP请求类型
			success: function(data) {
				app.log("新用户注册or绑定success:" + JSON.stringify(data));
				return callback(data);
			},
			error: function(data) {
				app.log("新用户注册or绑定error:" + JSON.stringify(data));
			}

		});

		var users = JSON.parse(localStorage.getItem('$users') || '[]');
		users.push(regInfo);
		localStorage.setItem('$users', JSON.stringify(users));
		return callback();
	};

	//保存服务器返回的 auth 信息 
	//{
	//	"access_token": "d3cac735-782d-4178-b048-354997dfc598",
	//	"token_type": "bearer",
	//	"refresh_token": "84fecc43-aebe-479b-a1c4-bde83459d2e2",
	//	"expires_in": 2407085,
	//	"scope": "all"
	//} 
	//
	app.setAuthinfo = function(authinfo) {
		authinfo = authinfo || {};
		localStorage.setItem('$authinfo', JSON.stringify(authinfo));
	};

	/**
	 *取出服务器返回的 auth 信息 
	 */
	app.getAuthinfo = function() {
		var authinfoText = localStorage.getItem('$authinfo') || "{}";
		return JSON.parse(authinfoText);
	};

	//保存服务器返回的 auth 信息 
	//{
	//	"access_token": "d3cac735-782d-4178-b048-354997dfc598",
	//	"token_type": "bearer",
	//	"refresh_token": "84fecc43-aebe-479b-a1c4-bde83459d2e2",
	//	"expires_in": 2407085,
	//	"scope": "all"
	//} 
	//

	app.setUserinfo = function(userinfo) {
		userinfo = userinfo || {};
		localStorage.setItem('$userinfo', JSON.stringify(userinfo));
	};

	/**
	 *取出服务器返回的 auth 信息 
	 */
	app.getUserinfo = function() {
		var userinfoText = localStorage.getItem('$userinfo') || "{}";
		return JSON.parse(userinfoText);
	};
	
	/**
	 *取出站点 信息 
	 */
	app.getSiteInfo = function() {
		var siteinfoText = localStorage.getItem('$siteinfo') || "{}";
		return JSON.parse(siteinfoText);
	};
	
	/**
	 *保存站点 信息 
	 */
	app.setSiteInfo = function() {
		siteinfo = siteinfo || {};
		localStorage.setItem('$siteinfo', JSON.stringify(siteinfo));
	};

	//保存手机号码
	app.setPhone = function(phoneNumber) {
		phoneNumber = phoneNumber || '';
		localStorage.setItem('$phoneNumber', phoneNumber);
	};

	/**
	 *取出手机号码
	 */
	app.getPhone = function() {
		var phoneNumber = localStorage.getItem('$phoneNumber') || "";
		return phoneNumber;
	};
	//保存验证码
	app.setValid = function(phoneValid) {
		phoneValid = phoneValid || '';
		localStorage.setItem('$phoneValid', phoneValid);
	};

	/**
	 *取出验证码
	 */
	app.getValid = function() {
		var phoneValid = localStorage.getItem('$phoneValid') || "";
		return phoneValid;
	};

	/**
	 * 设置当前状态
	 **/
	app.setState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
	};

	/**
	 * 获取当前状态
	 **/
	app.getState = function() {
		app.log("####################:获取 state 。。。");
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 找回密码
	 **/
	app.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if(!app.Reg.EMAIL.test(email)) {
			return callback('邮箱地址不合法');
		}
		return callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
	};

	/**
	 * 获取应用本地配置
	 **/
	app.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	app.getSettings = function() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	}
	/**
	 * 获取本地是否安装客户端
	 **/
	app.isInstalled = function(id) {
		if(id === 'qihoo' && mui.os.plus) {
			return true;
		}
		if(mui.os.android) {
			var main = plus.android.runtimeMainActivity();
			var packageManager = main.getPackageManager();
			var PackageManager = plus.android.importClass(packageManager)
			var packageName = {
				"qq": "com.tencent.mobileqq",
				"weixin": "com.tencent.mm",
				"sinaweibo": "com.sina.weibo"
			}
			try {
				return packageManager.getPackageInfo(packageName[id], PackageManager.GET_ACTIVITIES);
			} catch(e) {}
		} else {
			switch(id) {
				case "qq":
					var TencentOAuth = plus.ios.import("TencentOAuth");
					return TencentOAuth.iphoneQQInstalled();
				case "weixin":
					var WXApi = plus.ios.import("WXApi");
					return WXApi.isWXAppInstalled()
				case "sinaweibo":
					var SinaAPI = plus.ios.import("WeiboSDK");
					return SinaAPI.isWeiboAppInstalled()
				default:
					break;
			}
		}
	}

	//去除字符串前后空格
	app.strtrim = function(str) {
		return str.replace(/^(\s|\u00A0)+/, '').replace(/(\s|\u00A0)+$/, '');
	}

	//添加文件
	var files = [];
	var index = 1;
	app.appendFile = function(p) {
		console.log(p);
		files.push({
			name: "uploadkey" + index,
			path: p
		});
		index++;
	}
	
	
	// 上传文件
	app.upload = function(callback) {
		if(files.length <= 0) {
			app.log("没有添加上传文件！");
			return;
		}
		app.log("开始上传：")
		var wt = plus.nativeUI.showWaiting();
		var task = plus.uploader.createUpload(app.api['imgUpload'], {
				method: "POST"
			},
			function(t, status) { //上传完成
				console.log(JSON.stringify(t) + "---" + status);
				if(status == 200) {
					
					var data=eval('(' + t.responseText + ')');
					app.log("上传成功：" + t.responseText);
					app.log("data:"+data.data);
					wt.close();
					return callback(data.data);
				} else {
					app.log("上传失败：" + status);
					wt.close();
				}
			}
		);
		//	task.addData("client","HelloH5+");
		//	task.addData("uid",getUid());
		task.setRequestHeader('Authorization', app.getState().token);
		for(var i = 0; i < files.length; i++) {
			var f = files[i];
			app.log(f.path);
			task.addFile(f.path, {
				key: 'file'
			});
		}
		task.start();
	}
	
	//修改头像
	app.updateHeadImg=function(src,callback){
		app.ajax({
			url: app.api['updateHeadImg'],
			data: {avatar:src},
			showWaiting: true,
			type: 'post', //HTTP请求类型
			success: function(data) {
				app.log("修改头像success:" + JSON.stringify(data));
				return callback(data);  
			},
			error: function(data) {
				app.log("修改头像error:" + data);
			}

		});
	}
  
	

}(mui, window.app = {}));