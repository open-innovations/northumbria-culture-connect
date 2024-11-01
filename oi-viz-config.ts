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
			[ '#8F3E8D','#33A38C','#00478A','#005837','#F25C29', '#ED1163'],
	}
};
