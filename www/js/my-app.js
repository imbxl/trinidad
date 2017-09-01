var myApp = new Framework7({
	 swipePanel: 'left',
	 cache: false,
	 modalUsernamePlaceholder:'E-Mail',
	 modalPasswordPlaceholder:'Contraseña',
	 modalButtonOk:'Aceptar',
	 modalButtonCancel: 'Cancelar'
});

var BXL_WWW = 'http://rrhh.dia8labs.tk';

var $$ = Dom7;

var mainView = myApp.addView('.view-main', {
    dynamicNavbar: true
});

$$(document).on('deviceready', function() {
	$$('.view-main .navbar').show();
	if($$('.view-main .toolbar').html() != '') $$('.view-main .toolbar').show();
	testLogin();
});

myApp.onPageInit('cuenta', function (page) {
	myApp.closePanel();
})

myApp.onPageInit('registro', function (page) {
	myApp.closePanel();
})

var mySwiper1 = myApp.swiper('.swiper-1', {
  pagination: '.swiper-1 .swiper-pagination',
  paginationHide: false,
  paginationClickable: true,
  nextButton: '.swiper-button-next',
  prevButton: '.swiper-button-prev',
});

myApp.onPageAfterAnimation('index', function (page){
	mainView.showToolbar(false);
})

var XAP_init = false;
var Empresas = [];
$$(document).on('pageInit', function (e) {	
	if(!XAP_init){
		$$.getJSON(BXL_WWW+'/datos.php?tipo=empresas', function (json) {
			Empresas = [];
			$$.each(json, function (index, row) {
				Empresas.push(row);
			});
		});
		XAP_init = true;
	}
	
    var page = e.detail.page;
	
	//console.log(page.name);
	
    if (page.name === 'index') {
		testLogin();
		mainView.showToolbar(false);
	}else{
		mainView.hideToolbar(true);
	}
	
    if (page.name === 'cuenta') {
		$$.getJSON(BXL_WWW+'/datos.php?tipo=cuenta', function (json) {
			//console.log(json);
			$$('#Datos_Nombre').html(json['Nombre']);
			//$$('#Datos_DNI').html(json['DNI']);
			$$('#Datos_Tel').html(json['Telefono']);
			$$('#Datos_Email').html(json['Email']);
			//$$('#Datos_Puntos').html(parseInt(json['Puntos'])-parseInt(json['Canjes']));
		});
	}
	
    if (page.name === 'puestos') {
		myApp.popup('.popup-getting-started');
		GetProductos();
	}
		
    if (page.name === 'historial') {
		GetHistorial();
	}
	myApp.closePanel();
})

function CloseLoaderPrincipal(){
	myApp.closeModal('.popup-getting-started');
}

function Registrarme() {
    //verificamos conexion y servidores
	$$.post(BXL_WWW+"/registro_usuario.php", {
			Nombre:document.getElementById('formreg_name').value,
			Tel:document.getElementById('formreg_tel').value,
			DNI:document.getElementById('formreg_dni').value,
			Email:document.getElementById('formreg_mail').value,
			Clave:document.getElementById('formreg_pass').value
		},
		function( data ) {
        	if (data == 'OK') {
				alert('¡Se registró con exito en iClient!');
				login(document.getElementById('formreg_mail').value, document.getElementById('formreg_pass').value);
			}else{
				alert(data);
			}
		}
	);
}

var IniciadoSesion = false;
function login(strU, strP) {
    //verificamos conexion y servidores
	$$.post( BXL_WWW+"/login.php", {Email:strU, Clave:strP},
		function( data ) {
        	if (data == 'OK') {
				myApp.closeModal('.login-screen', false);
				var estrU = CryptoJS.AES.encrypt(strU, "strU");
				var estrP = CryptoJS.AES.encrypt(strP, "strP");
				window.localStorage.setItem("estru", estrU);
				window.localStorage.setItem("estrp", estrP);
				IniciadoSesion = true;
				mainView.router.load({url:'index.html'});
				ConfigPush();
				CloseLoaderPrincipal();
			}else{
				CloseLoaderPrincipal();
				MostrarModalLogin('Los datos no son correctos.<br/>');
			}
		}
	);
}
function LogOut() {
	myApp.popup('.popup-getting-started');
	window.localStorage.clear();
	IniciadoSesion = false;
	mainView.router.load({url:'index.html', reload: true});
}

var LoginModal;
function MostrarModalLogin(salida){
	$$('.login-message').html(salida);
	myApp.loginScreen('.login-screen');
	/*
	myApp.loginScreen(salida+'Si no está registrado puede registrarse haciendo click <a href="registro.html" onclick="myApp.closeModal(LoginModal)">AQUÍ</a>', 'Iniciar sesión', function (username, password) {
		login(username, password);
	}, function(){ MostrarModalLogin(salida); });
	*/
}
function doLogin(){
	myApp.popup('.popup-getting-started');
	login($$('#login-user').val(), $$('#login-pass').val());
}

function testLogin(){
	if(IniciadoSesion) return;
	var estru = window.localStorage.getItem("estru");
	var estrp = window.localStorage.getItem("estrp");
	if ((estru != null && estru != '') && (estrp != null && estrp != '')) {
		var dstru = CryptoJS.AES.decrypt(estru, "strU");
		var dstrp = CryptoJS.AES.decrypt(estrp, "strP");
		login(dstru.toString(CryptoJS.enc.Utf8), dstrp.toString(CryptoJS.enc.Utf8)); 		
	}else{
		CloseLoaderPrincipal();
		MostrarModalLogin('');
	}
}

function ConfigPush(){
	var push = PushNotification.init({
		"android": {
			"senderID": "1089320506180"
		},
		"ios": {
			"senderID": "1089320506180",
			"sound": true,
			"vibration": true,
			"badge": true
		}
	});
	push.on('registration', function(data) {
		var oldRegId = localStorage.getItem('registrationId');
		if (oldRegId !== data.registrationId) {
			// Save new registration ID
			localStorage.setItem('registrationId', data.registrationId);
			// Post registrationId to your app server as the value has changed
		}
		$$.post( BXL_WWW+"/datos.php?tipo=register", {id:data.registrationId});
	});
	push.on('error', function(e) { console.log("push error = " + e.message); });
	push.on('notification', function(data) {
		navigator.notification.alert(
			data.message,         // message
			function(){
				mainView.router.load({url:'cuenta.html', reload: true});
			},                 // callback
			data.title,           // title
			'Ok'                  // buttonName
		);
   });
}

function Escanear(){
	cordova.plugins.barcodeScanner.scan(
	  function (result) {
		  if(!result.cancelled){
			$$.get(result.text, function (data) {
				if(data == 'OK'){
		  			alert("¡Puntos agregados correctamente!");
				}else{
		  			alert(data);
				}
			});
		  }
	  },
	  function (error) {
		  alert("Error al leer el ticket");
	  },
	  {
		  preferFrontCamera : false, // iOS and Android
		  showFlipCameraButton : true, // iOS and Android
		  showTorchButton : false, // iOS and Android
		  torchOn: false, // Android, launch with the torch switched on (if available)
		  prompt : "Ponga el codigo QR dentro del marco", // Android
		  resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
		  formats : "QR_CODE", // default: all but PDF_417 and RSS_EXPANDED
		 // orientation : "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
		  disableAnimations : true, // iOS
		  disableSuccessBeep: true // iOS
	  }
   );
}

function FiltrarPorEmpresa(){
	var empresa = $$('#FiltroEmpresa').val();
	if(empresa == 'todas'){
		$$('.producto_item').show();
	}else{
		$$('.producto_item').hide();
		$$('.prod_empresa_'+empresa).show();
	}
}

function GetProductos(){
	$$.getJSON(BXL_WWW+'/datos.php?tipo=productos', function (json) {
		//console.log(json);
		var html = '';
		$$.each(json, function (index, row) {
			html += '<div id="prod_'+row.id+'" class="producto_item" categorias="'+row.Categorias+'">\
				<div class="card">\
                <div class="card-header">';
             html += '<div class="avatar">\
                    	<div class="circle-'+row.Estado+'"></div>\
                    </div>';
             html += '<div class="user flex-column">\
                        <div class="name">'+row.Departamento+'</div>\
                        <div class="time"><b>'+row.Turno+'</b></div>\
                    </div>\
                </div>\
                <div class="card-content">\
                    <div class="text">'+row.Descripcion+'</div>\
                </div>\
                <div class="card-footer flex-row">\
                <a href="#" onclick="ProductoVerMas('+row.id+')" class="tool flex-rest-width link"><i class="f7-icons">check</i> <span class="text">Postularme</span></a> \
            	</div>\
            	</div>\
			</div>';			
		}); 
		$$('.productos_lista').html(html);
		CloseLoaderPrincipal();
	});
}
function contains(obj, a) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}
function ProductoVerMas(id){
	var html = $$('#prod_'+id).html();
	$$('.popup-producto .contenido').html(html);
	$$('.popup-producto .contenido .card-footer').remove();
	//$$('.popup-producto .canjear').attr('onclick','ProductoCanjear('+id+')');
		
	var empresas_html = '<ul>';
	$$.each(Empresas, function (index, row) {
		var categorias = $$('#prod_'+id).attr("categorias").split(",");
		console.log(categorias);
		if(contains(row.id, categorias)){
			empresas_html += '<li><a href="#" onclick="ProductoCanjear('+id+','+row.id+')" class="item-link list-button">'+row.Nombre+'</a></li>';
		}
	});
	empresas_html += '<li><a href="#" class="close-popup item-link list-button">No postularme</a></li>';
	empresas_html += '</ul>';
	$$('#PostularmePor').html(empresas_html);
		
	myApp.popup('.popup-producto');
}
function ProductoCanjear(id, categoria){
	$$.getJSON(BXL_WWW+'/datos.php?tipo=canje&id='+id+'&categoria='+categoria, function (json) {
		if(json != 'OK'){
			alert(json['msg']);
			return;
		}
		alert('Se postuló correctamente!');
		mainView.router.load({url:'historial.html', reload: true});
	});
}

function GetHistorial(){
	$$.getJSON(BXL_WWW+'/datos.php?tipo=historial', function (json) {
		//console.log(json);
		var html = '';
		$$.each(json, function (index, row) {
			if(row.Usado == 'Y'){
				var CODE = 'Canje ya utilizado';
				var style = ' style="background-color: #DDD;"';	
			}else{
				var CODE = 'CODIGO: <b>'+row.Codigo+'</b>';
				var style = '';	
			}
			
			html += '<div id="histo_'+row.id+'">\
				<div class="card" '+style+'>\
                <div class="card-header">';
			if(row.URL != ''){
                    html += '<div class="avatar">\
                    	<img src="http://iclient.com.ar/archivos/productos/'+row.URL+'" alt="avatar">\
                    </div>';
			}
             html += '<div class="user flex-column">\
                        <div class="name">'+row.Titulo+'</div>\
                        <div class="time">'+CODE+'</div>\
                    </div>\
                </div>\
                <div class="card-content">\
                    <div class="text">'+row.Copete+'</div>\
                </div>\
                <div class="card-footer flex-row">\
                	<a href="#" onclick="HistorialVerMas('+row.id+')" class="tool tool-border flex-rest-width link"><i class="f7-icons">eye</i> <span class="text">Ver más</span></a> \
            	</div>\
            	</div>\
            	<div class="descripcion_larga" style="display:none">'+row.Descripcion+'</div>\
			</div>';			
		}); 
		$$('.historial_lista').html(html);
	});
}
function HistorialVerMas(id){
	var html = $$('#histo_'+id).html();
	$$('.popup-historial .contenido').html(html);
	$$('.popup-historial .contenido .card-footer').remove();
	$$('.popup-historial .descripcion_larga').show();
	myApp.popup('.popup-historial');
}
