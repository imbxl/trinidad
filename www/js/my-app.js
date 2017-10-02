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
	document.addEventListener("backbutton", function (e) { 
		e.preventDefault(); 
		if (mainView.activePage.name === 'index') {
			navigator.notification.confirm("Desea salir de la aplicación?", function(button){if(button!=2){ navigator.app.exitApp(); } }, "Confirmation", "Si,No");
		} else {
			mainView.router.back();
		}
		//return false;
	}, false ); 
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
	mainView.hideToolbar(true);
})

var XAP_init = false;
var Categorias = [];
var Turnos = [];
var Departamentos = [];
function HomeBloquesResize(){
	var height = $$(window).height() - $$('.navbar').height();
	height = ((height-45)/2);
	var font_size_h = (height * 0.5);
	var font_size_w = (($$(window).width() / 2) - 30) * 0.5;
	if(font_size_h > font_size_w) var fsize = font_size_w; else var fsize = font_size_h;
	$$('.bloquehome').css('height',height+'px');
	$$('.bloquehome i').css('line-height',(height-15)+'px');
	$$('.bloquehome i').css('font-size',fsize+'px');
	$$('.bloquehome span').css('margin-top',((fsize/2)-5)+'px');
}
$$(window).on('resize orientationchange', function (e) {	
	HomeBloquesResize();
});
$$(document).on('pageInit', function (e) {
	HomeBloquesResize();	
	if(!XAP_init){
		$$.getJSON(BXL_WWW+'/datos.php?tipo=datos_info', function (json) {
			Categorias = [];
			$$.each(json['categorias'], function (index, row) {
				Categorias.push(row);
			});
			Turnos = [];
			$$.each(json['turnos'], function (index, row) {
				Turnos.push(row);
			});
			Departamentos = [];
			$$.each(json['departamentos'], function (index, row) {
				Departamentos.push(row);
			});
		});
		XAP_init = true;
	}
	
    var page = e.detail.page;
	
	//console.log(page.name);
	
    if (page.name === 'index') {
		testLogin();
		mainView.showToolbar(false);
		$$('#MainToolbar').html('');
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
			$$('#Datos_Horas').html('<input type="number" onChange="CambiarHoras(this.value);" value="'+json['HorasAviso']+'">');
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
		
    if (page.name === 'calendario') {
		GetCalendario();
		mainView.hideToolbar(false);
		mainView.showToolbar(true);
		$$('#MainToolbar').html($$('.calendar-toolbar').html());
		$$('#MainToolbar').show();
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
				navigator.notification.alert('¡Se registró con exito en Sanatorio de la Trinidad!',function(){},'Registro');
				login(document.getElementById('formreg_mail').value, document.getElementById('formreg_pass').value);
			}else{
				navigator.notification.alert(data,function(){},'Error');
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
	if(typeof PushNotification === 'undefined') return;
	var push = PushNotification.init({
		"android": {
			"senderID": "566381100711"
		},
		"ios": {
			"senderID": "566381100711",
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
		if(data.title == 'Asignado a puesto'){
			mainView.router.load({url:'historial.html', reload: true});
		}else if(data.title == 'Nuevo puesto'){
			mainView.router.load({url:'puestos.html', reload: true});
		}
   });
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
			var Postulado = parseInt(row.Postulado) || 0;
			html += '<div id="prod_'+row.id+'" class="producto_item" categorias="'+row.Categorias+'">\
				<div class="card">\
                <div class="card-header">';
             html += '<div class="avatar">\
                    	<div class="circle-'+row.Estado+'"></div>\
                    </div>';
             html += '<div class="user flex-column">\
                        <div class="name">'+row.Departamento+'</div>\
                        <div class="time">'+row.Fecha+' - <b>'+row.Turno+'</b></div>\
                    </div>\
                </div>\
                <div class="card-content">\
                    <div class="text">'+row.Descripcion+'</div>\
                </div>\
                <div class="card-footer flex-row">';
				if(Postulado > 0){
                html += '<div class="flex-rest-width tool" style="text-align:center;"><b style="text-align:center;"><span class="text">Ya postulado</span></b></div>';
				}else{
                html += '<a href="#" onclick="ProductoVerMas('+row.id+')" class="tool flex-rest-width link"><i class="f7-icons">check</i> <span class="text">Postularme</span></a>';
				}				
            html += '</div>\
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
	$$.each(Categorias, function (index, row) {
		var categorias = $$('#prod_'+id).attr("categorias").split(",");
		//console.log(categorias);
		if(contains(row.id, categorias)){
			empresas_html += '<li><a href="#" onclick="ProductoCanjear('+id+','+row.id+')" class="item-link list-button">'+row.Nombre+'</a></li>';
		}
	});
	empresas_html += '<li><a href="#" onclick="ProductoCanjear('+id+',\'0\')" class="item-link list-button">No estoy interesado</a></li>';
	empresas_html += '</ul>';
	$$('#PostularmePor').html(empresas_html);
		
	myApp.popup('.popup-producto');
}
function ProductoCanjear(id, categoria){
	$$.getJSON(BXL_WWW+'/datos.php?tipo=postularme&id='+id+'&categoria='+categoria, function (json) {
		if(json != 'OK'){
			navigator.notification.alert(json['msg'],function(){},'Error');
			return;
		}
		navigator.notification.alert('Ya recibimos su respuesta!',function(){},'Confirmación');
		myApp.closeModal('.popup-producto', false);
		mainView.router.load({url:'historial.html', reload: true});
	});
}

function GetHistorial(){
	$$.getJSON(BXL_WWW+'/datos.php?tipo=historial', function (json) {
		//console.log(json);
		var html = '';
		$$.each(json, function (index, row) {
			var Postulado = parseInt(row.Postulado) || 0;
			html += '<div id="prod_'+row.id+'" class="producto_item" categorias="'+row.Categorias+'">\
				<div class="card">\
                <div class="card-header">';
             html += '<div class="avatar">\
                    	<div class="circle-'+row.Estado+'"></div>\
                    </div>';
             html += '<div class="user flex-column">\
                        <div class="name">'+row.Departamento+'</div>\
                        <div class="time">'+row.Fecha+' - <b>'+row.Turno+'</b></div>\
                    </div>\
                </div>\
                <div class="card-content">\
                    <div class="text">'+row.Descripcion+'</div>\
                </div>\
            	</div>\
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
function CambiarHoras(val){
	$$.get(BXL_WWW+'/datos.php?tipo=horas&val='+val);
}

var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto' , 'Septiembre' , 'Octubre', 'Noviembre', 'Diciembre'];
var calendarInline;
function GetCalendario(){
	calendarInline = myApp.calendar({
		container: '#calendar-inline-container',
		value: [new Date()],
		weekHeader: false,
		toolbarTemplate: 
			'<div class="toolbar calendar-custom-toolbar">' +
				'<div class="toolbar-inner">' +
					'<div class="left">' +
						'<a href="#" class="link icon-only"><i class="icon icon-back"></i></a>' +
					'</div>' +
					'<div class="center"></div>' +
					'<div class="right">' +
						'<a href="#" class="link icon-only"><i class="icon icon-forward"></i></a>' +
					'</div>' +
				'</div>' +
			'</div>',
		onOpen: function (p) {
			console.log(p);
			$$('.calendar-custom-toolbar .center').text(monthNames[p.currentMonth] +', ' + p.currentYear);
			$$('.calendar-custom-toolbar .left .link').on('click', function () {
				calendarInline.prevMonth();
			});
			$$('.calendar-custom-toolbar .right .link').on('click', function () {
				calendarInline.nextMonth();
			});
			$$('#PuestoFecha').html('Hoy');
		},
		onDayClick: function (p, dayContainer, year, month, day) {
			var Hoy = new Date();
			if(Hoy.getDay() == day && Hoy.getMonth() == month && Hoy.getFullYear() == year){
				$$('#PuestoFecha').html('Hoy');
			}else{
				$$('#PuestoFecha').html(day+'/'+(parseInt(month)+1)+'/'+year);
			}
		},
		onMonthYearChangeStart: function (p) {
			$$('.calendar-custom-toolbar .center').text(monthNames[p.currentMonth] +', ' + p.currentYear);
		}
	});    
}
function PostularmeCalendario(){
	var date = new Date(calendarInline.value);
	var day = date.getDate();
	if(day < 10) day = '0'+day;
	var month = (date.getMonth()+1);
	if(month < 10) month = '0'+month;
	var year = date.getFullYear();
	
	$$('#Postularme_Fecha').val(year+'-'+month+'-'+day);
	
	$$('.postularme_fecha').html(day+'/'+month+'/'+year);	
	
	var html = '';
	$$.each(Categorias, function (index, row) {
		html += '<option value="'+row.id+'">'+row.Nombre+'</option>';
	});
	$$('#Postularme_Categoria').html(html);
	
	var html = '';
	$$.each(Departamentos, function (index, row) {
		html += '<option value="'+row.id+'">'+row.Nombre+'</option>';
	});
	$$('#Postularme_Departamento').html(html);
	
	var html = '';
	$$.each(Turnos, function (index, row) {
		html += '<option value="'+row.id+'">'+row.Nombre+' ('+row.Horarios+')</option>';
	});
	$$('#Postularme_Turno').html(html);
	
	myApp.popup('.popup-postularme');
}
function EnviarSolicitud(){	
	myApp.popup('.popup-getting-started');
	$$.post(BXL_WWW+"/datos.php?tipo=enviar_solicitud", {
			Fecha:document.getElementById('Postularme_Fecha').value,
			Categoria:document.getElementById('Postularme_Categoria').value,
			Departamento:document.getElementById('Postularme_Departamento').value,
			Turno:document.getElementById('Postularme_Turno').value,
			Descripcion:document.getElementById('Postularme_Descripcion').value
		},
		function( data ) {
        	if (data == 'OK') {
				myApp.closeModal('.popup-postularme', false);
				CloseLoaderPrincipal();
			}else{
				navigator.notification.alert(data,function(){},'Error');
			}
		}
	);
}
