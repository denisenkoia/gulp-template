import Vue from 'vue';
import App from './app.vue';

if (document.querySelector('#app') != undefined) {

 	new Vue ({
  		el: '#app',
  		template: '<App/>',
  		// components: { 
  		// "test-com":  App 
  		// },
  		render: function (createElement) {
  			return createElement(App);
  		}
	})
 }

