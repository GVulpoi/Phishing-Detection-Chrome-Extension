async function main() {
	const url = document.URL;

	const htmlText = document.documentElement.outerHTML;
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlText, 'text/html');

	const features = await new Promise((resolve, reject) =>
	{
		chrome.runtime.sendMessage({ action: "EXTRACT_FEATURES", content: { url, doc: doc } }, (response) => 
		{
			if (chrome.runtime.lastError)
			{
				console.error("Error sending message:", chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
			}
			else
			{
			resolve(response);
			}
		});
	});

	console.log("Extracted features:", features);

	const predictResponse = await new Promise((resolve, reject) =>
	{
		chrome.runtime.sendMessage({ action: "PREDICT", features: features }, (response) =>
		{
			if (chrome.runtime.lastError) {
				console.error("Error sending prediction message:", chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
			}
			else
			{
				resolve(response);
			}
		});
	});

	console.log("Prediction result:", predictResponse);
}

main();
