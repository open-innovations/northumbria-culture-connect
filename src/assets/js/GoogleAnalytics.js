/* OI Google Analytics consent form v1.1 */
(function(root){

	var OI = root.OI || {};

	function GA(){

		var _obj = this;
		var tag,el,consentToken,consentDate,gaAdded,maxAge;
		var events = {'select':[]};

		addEventListener("storage",function(e){
			console.log('storage');
		});

		function get(){
			consentToken = localStorage.getItem('ga-consent')||null;
			consentDate = localStorage.getItem('ga-consent-date')||null;
			if(consentToken) consentToken = (consentToken=="true");
			if(consentDate) consentDate = parseInt(consentDate);
		}

		function consent(ok){
			var dt = (new Date()).getTime();
			localStorage.setItem('ga-consent',ok);
			localStorage.setItem('ga-consent-date',dt);
			consentToken = ok;
			consentDate = dt;
			_obj.trigger('select');
			return this;
		};

		function show(){
			if(el){
				el.removeAttribute('hidden');
				// add events to buttons 
				var yes = el.querySelector('#cookie-accept');
				var no = el.querySelector('#cookie-reject');
				if(yes) yes.addEventListener('click',function(e){ e.preventDefault(); _obj.accept(); });
				else console.warn('Yes button missing',el);
				if(no) no.addEventListener('click',function(e){ e.preventDefault(); _obj.reject(); });
				else console.warn('No button missing',el);
			}
		}

		function hide(){
			if(el) el.setAttribute('hidden',true);
		}

		function addGA(){
			if(typeof gaAdded==="undefined" && tag!="TEST"){
				(function(w,d,s,l,i){
					w[l]=w[l]||[];
					w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
					var f = d.getElementsByTagName(s)[0],j = d.createElement(s),dl = l!='dataLayer'?'&l='+l:'';
					j.async = true;
					j.src = 'https://www.googletagmanager.com/gtm.js?id='+i+dl;
					f.parentNode.insertBefore(j,f);
					gaAdded = j;
				})(window,document,'script','dataLayer',tag);
			}
		}

		this.set = function(opts){
			if(!opts) opts = {};
			if(opts.id){
				tag = opts.id;
			}else{
				console.warn('No Google Analytics tag given');
				return this;
			}
			if(opts.overlay){
				el = opts.overlay;
			}else{
				console.warn('No cookie overlay given');
				return this;
			}
			maxAge = (typeof opts.age==="number") ? opts.age : 90 * 24 * 60 * 60 * 1000;
			this.on('select',opts.choose);
			get();

			var expired = true;
			if(typeof consentDate=="number") expired = (Date.now() - consentDate > maxAge);
			if(expired) show();
			else{
				if(consentToken) addGA();
				hide();
			}
			if(typeof consentToken==="boolean") this.trigger('select');

			return this;
		};

		this.on = function(typ,fn){
			if(typ in events && typeof fn==="function") events[typ].push(fn);
			return this;
		};

		this.trigger = function(typ){
			var data = {};
			if(typ=="select") data = {'consent':consentToken,'date':consentDate};
			for(var i = 0; i < events[typ].length; i++) events[typ][i].call(_obj,data);
			return this;
		};

		this.reset = function(){
			localStorage.removeItem('ga-consent');
			localStorage.removeItem('ga-consent-date');
			get();
			show();
			if(gaAdded) gaAdded.remove();
			gaAdded = undefined;
		};

		this.accept = function(){
			consent(true);
			hide();
			addGA();
			return this;
		};

		this.reject = function(){
			consent(false);
			hide();
			if(gaAdded) gaAdded.remove();
			gaAdded = undefined;
			return this;
		};
		
		return this;
	};

	OI.GoogleAnalytics = new GA();

	root.OI = OI||root.OI||{};

})(window || this);