//Logistics for fetching scripts and url's of scripts files

//Function that fetches the content from all urls of js content
async function copyCodeFromFile(url)
{
	try
	{
		const response = await fetch(url);
		
		if (!response.ok)
		{
			throw new Error(`The response from url wasn't recieved ${response.statusText}`);
		}

		//console.log(`Script from url : ${url}`, data);
		return await response.text();

	}
	catch(err)
	{
		console.log(`Fetch operation has failed for url ${url}`, err);
		return "Error script!";

	}
}

//Function that returns the content from all inline and external scripts
async function retrieveExternalInternal()
{
	const scriptName = Array.from(document.querySelectorAll('script'));

	const inlineScripts = scriptName
									.filter(script => !script.src)
									.map(script => script.textContent);

	const externalScriptsUrls = scriptName
									.filter(script => script.src)
									.map(script => script.src);

	externalScriptsContent = await Promise.all(externalScriptsUrls.map(copyCodeFromFile));

	return {inlineScripts, externalScriptsContent};
}

//Function that cancatenates all the scripts and send them to service worker via message
async function RetrieveScrips()
{
	const {inlineScripts, externalScriptsContent} = await retrieveExternalInternal();
	const allScripts =  inlineScripts.concat(externalScriptsContent);

	chrome.runtime.sendMessage({
		action : "PROCESS_SCRIPTS",
		allScripts
	}
	);
}

console.log("Retrieve Scripts working!");

RetrieveScrips();