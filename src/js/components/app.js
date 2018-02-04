import Vue from 'vue';
import App from './app.vue';

if (document.querySelector('#app') != undefined) {

 	new Vue ({
  		el: '#app',
  		template: '<App/>',
  		render: (createElement) => {
  			return createElement(App);
  		}
	})

 }

