(function($, cms) {

	cms.config = {
		isDebug: true, //是否调试模式，发布时为false（发布时一定要改为false）
		serverHost: 'http://192.168.1.200', //API服务器域名
		//		dbName: 'qunzhanDb', //本地存储数据库名称
		//		basicAuthorization: 'Basic YXBwLXF1bnpoYW46YXBwNjBmNzg2ODFkMDYzNTkwYTQ2OWYxYjI5N2ZlZmYzYzQ=',
		//		SMS: {
		//			upperlimit: 3, //找回密码短信发送次数上限
		//			seconds: 60 //发送间隔时间
		//		}
	};

	/**
	 * 日志打印
	 */
	cms.log = function() {
		if(app.config.isDebug && console) {
			for(var key in arguments) {
				if(mui.isObject(arguments[key])) {
					arguments[key] = JSON.stringify(arguments[key]);
				}
			}
			console.log.apply(console, arguments);
		}
	};
	
	cms.api={
		//用户添加新站点
		'addSite':'/cms/site/add'
	}
	
	cms.

}(mui, window.cms = {}))