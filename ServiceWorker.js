import * as tf from "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.11.0/dist/tf.fesm.js";

//running prediction
async function predict(features)
{
	const model = await tf.loadLayersModel(chrome.runtime.getURL('Model/model.json'));
	const featureOrder = [
	"NumDots",
	"SubdomainLevel",
	"PathLevel",
	"UrlLength",
	"NumDash",
	"NumDashInHostname",
	"AtSymbol",
	"TildeSymbol",
	"NumUnderscore",
	"NumPercent",
	"NumQueryComponents",
	"NumAmpersand",
	"NumHash",
	"NumNumericChars",
	"NoHttps",
	"RandomString",
	"IpAddress",
	"DomainInSubdomains",
	"DomainInPaths",
	"HttpsInHostname",
	"HostnameLength",
	"PathLength",
	"QueryLength",
	"DoubleSlashInPath",
	"NumSensitiveWords",
	"PctExtHyperlinks",
	"PctExtResourceUrls",
	"InsecureForms",
	"RelativeFormAction",
	"ExtFormAction",
	"AbnormalFormAction",
	"FakeLinkInStatusBar",
	"ImagesOnlyInForm"
	];


	const featuresArray = featureOrder.map(key => features[key]);
	const mean = [2.4445, 0.59375, 3.30325, 70.42725, 1.836125, 0.142, 0.00025, 0.013375, 0.3195, 0.07825, 0.45225, 0.277, 0.0025, 5.886625, 0.98875, 0.527125, 0.017, 0.023375, 0.4285, 0.0, 18.892375, 35.724, 8.538, 0.00075, 0.1095, 0.2423162000131875, 0.3921502151341875, 0.842875, 0.250625, 0.1015, 0.05725, 0.005, 0.0315];
	const scale = [1.3571734413847039, 0.769877222354318, 1.8767763418958585, 33.30006692842373, 3.103307910017148, 0.5575266809758973, 0.015809411753762374, 0.11487431991093569, 1.100077156384951, 0.6607775249658542, 1.3115715525658522, 1.1258423513085658, 0.04993746088859544, 9.670678420326828, 0.10546770832818923, 0.49926369222586175, 0.12927103310486848, 0.15109139411296724, 0.49486134421674116, 1.0, 8.339696748645899, 24.72867918025546, 24.11804419931268, 0.027375856150995536, 0.3691337833360691, 0.34344957402401205, 0.3873303993405749, 0.3639185820688468, 0.43337294490427064, 0.301989652140599, 0.23231968814545184, 0.07053367989832943, 0.17466467874186814];
	const normalisedFeatures = featuresArray.map((v, i) => (v - mean[i]) / scale[i])

	//console.log(normalisedFeatures);

	if(model)
	{

		const inputTensor = tf.tensor2d([normalisedFeatures], [1, 33]);
		
		const prediction = model.predict(inputTensor);

		const result = await prediction.data();
		//console.log(result[0].toFixed(5));
		return (result[0] > 0.995) ? 1 : 0;
	}
	else
	{
		console.log("Model isn't loaded but predict was called!");
	}

	return null;
}


//ServiceWorker -- manage all events from all the scripts
console.log("Service worker loaded!");

let isDisabled = false;

chrome.runtime.onInstalled.addListener(() => {
	console.log("Extension Installed!");
});


//Managing all the messages
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) =>
{
	//Messages for popup
	if(message.action === "GET_EXTENSION_STATE")
	{
		sendResponse({ isDisabled });
		return;
	}

	if(message.action === "DISABLE_EXTENSION")
	{
		isDisabled = true;
		console.log("Extension disabled!");
		return;
	}

	if(message.action === "ENABLE_EXTENSION")
	{
		isDisabled = false;
		console.log("Extension enabled!");
		return;
	}

	//Managing extension logistics messages + default case unknown action
	if(!isDisabled)
	{
		if (!message.action)
		{
			console.log("Recieved message without action! Message ignored!");
			sendResponse({ status: "error"});
			return;
		}

		//Processing messages
		switch(message.action)
		{
			case "PREDICTION_RESULT":
				console.log("Prediction: ", message.prediction)
				return;

			case "FEATURES_EXTRACTED":
				const pred = await predict(message.content);
				console.log(pred ? "This site was evaluated as phishing!" : "This site was evaluated as non-phishing!");
				sendResponse({result: pred});
				return true;

			default:
				console.log("Recieved message with unknown action!");
				sendResponse({ status: "error"});
				return;
	}
	}
}
);