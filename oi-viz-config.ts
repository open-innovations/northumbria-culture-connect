import { metricsBuilder } from './lib/font-metrics.ts';

export default {
	"componentNamespace": 'oi',
	"font": {
		"family": 'Hanken Grotesk, sans-serif',
		"weight": 'normal',
		"size": 16,
		"fonts": {
			'Hanken Grotesk': {
				normal: await metricsBuilder('src/assets/fonts/webfonts/hanken-grotesk-latin-400-normal.woff'),
				bold: await metricsBuilder('src/assets/fonts/webfonts/hanken-grotesk-latin-700-normal.woff')
			}
		},
	},
	"map": {
		"tileLayer": 'CartoDB.Positron'
	},
	"colour": {
		"series": 
			[ '#8F3E8D','#33A38C','#005837','#F25C29','#00478A', '#ED1163','#c79ec6','#99d1c5','#7fa3c4','#f8ad94','#7fab9b'],
		"names":{
			"StrongAgree": "#005837",
			"Agree": "#33a38c",
			"Neither": "#7fa3c4",
			"Disagree": "#f24d8a",
			"StrongDisagree": "#8f3e8d",
			"DontKnow": "#999999"
		}
	}
};
