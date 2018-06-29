(function($, tool) {

	//显示预览效果
	tool.headImgPreview = function(u) {
		var objDiv = document.createElement('div');
		objDiv.setAttribute('style', "width: 100%;height:100%;z-index: 999;position: absolute;top:0;left: 0;background-color:rgba(0,0,0,0.8)");
		//			var objImg = document.createElement('img');
		//			objImg.setAttribute('style', 'width: 100%;z-index: 999;position: absolute;top:50%;left: 0;margin-top: -50%;');
		//			objImg.setAttribute("src", u);
		var objWrap = document.createElement('div');
		objWrap.setAttribute('style', 'width: 100%;height: 50%;background-repeat: no-repeat;background-size: cover;background-position: center; position: absolute;top:50%;margin-top: -40%;background-image: '+ u +';');
		objDiv.appendChild(objWrap);
		document.body.appendChild(objDiv);
		//			document.body.appendChild(objImg);
		objDiv.addEventListener('tap', function() {
			document.body.removeChild(objDiv);
			//				document.body.removeChild(objImg);
		});
//		objImg.addEventListener('tap', function() {
//			document.body.removeChild(objDiv);
//			//				document.body.removeChild(objImg);
//		});
	}

}(mui, window.tool = {}));