


(function($, rel) {

	var _self = plus.webview.currentWebview();
	_self.setStyle({
		popGesture: 'close'
	});
	var token = _self.token;
	console.log("token1:" + token);


	// 添加文件
	var relindex = 1;
	var relfiles = [];
	rel.addFile = function(p) {
		console.log("p:" + p);
		relfiles.push({
			name: "uploadkey" + relindex,
			path: p
		});
		relindex++;
	}

	rel.showActionSheet = function() {

		var bts = [{
			title: "相册"
		}, {
			title: "拍"
		}, {
			title: "录"
		}];
		plus.nativeUI.actionSheet({
				//			title: "请选择",
				cancel: "取消",
				buttons: bts
			},
			function(e) {

				//打开相册
				if(e.index == 1) {
					rel.galleryImgsSelected();
				}
				//打开拍照
				if(e.index == 2) {
					rel.getImage();
				}
				//打开录像
				if(e.index == 3) {
					rel.getVideo();
				}

			}
		);
	}

	var lfs = null; // 保留上次选择图片列表

	// 拍照
	rel.getImage = function() {
		//	outSet('开始拍照：');
		var cmr = plus.camera.getCamera();
		cmr.captureImage(function(p) {
			//		outLine('成功：'+p);

			plus.io.resolveLocalFileSystemURL(p, function(entry) {
				createItem(entry.fullPath)
				rel.previewImage();

			}, function(e) {
				alert("Resolve file URL failed: " + e.message);
			});
		}, function(e) {
			outLine('失败：' + e.message);
		}, {
			filename: '_doc/camera/',
			index: 1
		});
	}

	// 录像
	rel.getVideo = function() {
		//	outSet('开始录像：');
		var cmr1 = plus.camera.getCamera();
		cmr1.startVideoCapture(function(p) {
			//		outLine('成功：'+p);

			plus.io.resolveLocalFileSystemURL(p, function(entry) {
				rel.createVideo(entry.fullPath);
				alert(1);
			}, function(e) {
				//			outLine('读取录像文件错误：'+e.message);
			});
		}, function(e) {
			//		outLine('失败：'+e.message);
		}, {
			filename: '_doc/camera/',
			index: 2
		});

	}

	// 从相册中选择图片
	rel.galleryImgsSelected = function() {

		plus.gallery.pick(function(e) {
				lfs = e.files;
				for(var i in e.files) {
					rel.createItem(e.files[i])
				}
				rel.previewImage();
			},
			function(e) {
				console.log('取消选择图片');
			}, {
				filter: 'none',
				multiple: true,
				maximum: 9,
				selected: lfs,
				system: false,
				onmaxed: function() {
					plus.nativeUI.alert('最多只能选择9张图片');
				}
			}); // 最多选择3张图片
	}

	//创建图片缩略图列表
	rel.createItem = function(url) {

		//	var pics = document.getElementById("pics");
		//	var objLi = document.createElement('li');
		//	objLi.setAttribute('class', 'cPics mui-table-view-cell mui-media mui-col-xs-4 mui-col-sm-3');
		//
		//	var objimg = document.createElement('img');
		//	objimg.src = url;
		//	objimg.setAttribute('style', 'max-width: 100%;height: auto;');
		//
		//	objLi.appendChild(objimg);
		//	pics.appendChild(objLi);

		//创建div
		var objDiv = document.createElement('div');
		objDiv.setAttribute('class', 'cPics mui-col-xs-4');
		//创建img
		var objImg = document.createElement('img');
		objImg.src = url;
		objImg.setAttribute('class', 'releaseItem');

		objDiv.appendChild(objImg);

		//获取父容器
		var objParent = document.getElementsByClassName('mui-row')[0];
		objParent.appendChild(objDiv);

	}

	//创建视频缩略图列表
	rel.createVideo = function(url) {
		var pics = document.getElementById("pics");

		var objLi = document.createElement('li');
		objLi.setAttribute('style', 'width: 120px;height: 100px;overflow: hidden;')
		objLi.setAttribute('class', 'cPics mui-table-view-cell mui-media mui-col-xs-4 mui-col-sm-3');

		var objV = document.createElement('video');
		var objSource = document.createElement('source');
		objSource.src = url;

		objV.appendChild(objSource);
		objLi.appendChild(objV);

		pics.appendChild(objLi);
	}

	//图片预览
	rel.previewImage = function() {

		var images = [].slice.call(document.querySelectorAll('.cPics img'));
		var urls = [];

		images.forEach(function(item) {
			urls.push(item.src);
		});

		mui('.cPics').on('tap', 'img', function() {
			var index = images.indexOf(this);
			plus.nativeUI.previewImage(urls, {
				current: index,
				loop: false,
				indicator: 'number'
			});
		});
	}
		
		var server='http://192.168.1.200/file/upload/avatar';
		// 上传文件
		 rel.upload=function(src,callback) {
			if(src==null||src=='undefind'||src==''){
				console.log("没有添加上传文件！");
				return;
			}
			console.log("开始上传：")
			var wt = plus.nativeUI.showWaiting();
			var task = plus.uploader.createUpload(server, {
					method: "POST"
				},
				
				function(t, status) { //上传完成
					console.log(JSON.stringify(t) + "---" + status);
					if(status == 200) {
						console.log("上传成功：" + t.responseText);
						wt.close();
						return callback(t.data);
					} else {
						console.log("上传失败：" + status);
						wt.close();
					}
				}
			);
			//	task.addData("client","HelloH5+");
			//	task.addData("uid",getUid());
			task.setRequestHeader('Authorization', token);
			console.log("token  r:"+token);
			console.log('src111:'+src);
			task.addFile(src, {
					key: 'file'
				});
			task.start();
		}


}(mui, window.rel = {}));