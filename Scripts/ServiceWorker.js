//ServiceWorker -- manage all events from all the scripts
console.log("Service worker loaded!");

let isDisabled = false;

chrome.runtime.onInstalled.addListener(() => {
	console.log("Extension Installed!");
});


//Managing all the messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
{
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
				console.log("Features :", message.content);
				chrome.runtime.sendMessage({action: "RUN_PREDICTION", features: message.content}, (response) =>
				{
					if(chrome.runtime.lastError)
					{
						console.warn("Failed to send to Model :", chrome.runtime.lastError.message);
						sendResponse({ status: "error", error: chrome.runtime.lastError.message });
					}
					else
					{
						console.log("Prediction :", response.prediction);
						sendResponse({status: "success"});
					}
				});

				return;

			default:
				console.log("Recieved message with unknown action!");
				sendResponse({ status: "error"});
				return;
	}
	}
}
);