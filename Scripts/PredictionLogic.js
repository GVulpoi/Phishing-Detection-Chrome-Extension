function shannonEntropy(str)
{
	if(!str) return 0;

	const counts = {};
	for (const char of str)
	{
		counts[char] = (counts[char] || 0) + 1
	}
	const len = str.length;
	return -Object.values(counts).map(count => count / len).reduce((sum, p) => sum + p * Math.log2(p), 0);
}

function hasRandomString(url, treshold = 4.0)
{
	try
	{
		const path = new URL(url).pathname.replace(/\//g, '');
		const entropy = shannonEntropy(path);
		return entropy > treshold ? 1 : 0
	}
	catch
	{
		return 0;
	}
}

function domainInSubdomains(url)
{
	try
	{
		const hostname = new URL(url).hostname;
		const parts = hostname.split('.');
		
		if (parts.length < 2)
		{
			return 0;
		}

		const domain = parts[parts.length - 2];
		const subomains = parts.slice(0, -2);
		return subomains.includes(domain) ? 1 : 0;
	}
	catch
	{
		return 0;
	}
}

async function getHTML(url)
{
	try
	{
		const res = await fetch(url);
		return await res.text();
	}
	catch
	{
		return 0;
	}
}

function countNumericChars(str)
{
	return (str.match(/\d/g) || []).length;
}

function countSensitiveWords(url)
{
	const words = ['secure', 'account', 'login', 'signin', 'verify', 'bank', 'update'];
	return words.reduce((count, word) => count + (url.toLowerCase().includes(word) ? 1 : 0), 0);
}

function pctExternalLinks(anchors, domain)
{
	if (!anchors.length)
	{
		return 0;
	}

	let external = 0;
	for (const anc of anchors)
	{
		const href = anc.getAttribute('href') || '';

		if (href.startsWith('http') && !href.includes(domain))
		{
			external++;
		}
	}

	return external / anchors.length;
}

function pctExternalResources(elements, domain) {
	if (!elements || elements.length === 0) return 0;

	let external = 0;

	for (const el of elements) {
		let url = el.getAttribute('src') || el.getAttribute('href') || '';

		if (!url || url.startsWith('#')) continue;

		if (url.startsWith('http') && !url.includes(domain)) {
			external++;
		}
	}

	return external / elements.length;
}


function detectInsecureForms(forms)
{
	return [...forms].some(form => 
		{
			const action = form.getAttribute('action') || '';
			return action && !action.startsWith('https');
		}) ? 1 : 0;
}

function detectRelativeFormAction(forms)
{
	return [...forms].some(form =>
	{
			const action = form.getAttribute('action') || '';
			return action && !action.startsWith('http');
	}
	) ? 1 : 0;
}

function detectFakeLinkStatusBar(links)
{
	return [...links].some(links =>
	{
		const mouseOver = links.getAttribute('onmouseover') || '';
		return mouseOver.includes('window.status') || mouseOver.includes('status=');
	}) ? 1 : 0;
}

function detectImagesOnlyInForms(forms)
{
	return [...forms].some(form =>
	{
		const inputs = form.querySelectorAll('input');
		return inputs.length > 0 && [...inputs].every(input => input.type === 'image');
	}) ? 1 : 0;
}

function detectExtFormAction(forms, domain)
{
	return [...forms].some(form =>
	{
		const actions = form.getAttribute('action') || '';
		return actions && actions.startsWith('http') && !actions.includes(domain); 
	}) ? 1 : 0;
}

function detectAbnormalFormAction(doc)
{
	const forms = doc.querySelectorAll('form');
	const inputs = doc.querySelectorAll('input');
	const buttons = doc.querySelectorAll('button');

	const emptyAction = [...forms].some(form => !(form.getAttribute('action') || '').trim());
	const emptyInputAction = [...inputs].some(input => !(input.getAttribute('formaction') || '').trim());
	const disabledButton = [...buttons].some(button => button.hasAttribute('disabled'));

	return (emptyAction || emptyInputAction || disabledButton) ? 1 : 0;
}

async function extractFeatures(url)
{
	const urlObj = new URL(url);
	const hostname = urlObj.hostname;
	const path = urlObj.pathname;
	const query = urlObj.search;

	const htmlText = await getHTML(url);
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlText, 'text/html');

	const features =
	{
		NumDots: (url.match(/\./g) || []).length,
		SubdomainLevel: (hostname.match(/\./g) || []).length,
		PathLevel: (path.match(/\//g) || []).length,
		UrlLength: url.length,
		NumDash: (url.match(/-/g) || []).length,
		NumDashInHostname: (hostname.match(/-/g) || []).length,
		AtSymbol: url.includes('@') ? 1 : 0,
		TildeSymbol: url.includes('~') ? 1 : 0,
		NumUnderscore: (url.match(/_/g) || []).length,
		NumPercent: (url.match(/%/g) || []).length,
		NumQueryComponents: query ? query.split('&').length : 0,
		NumAmpersand: (query.match(/&/g) || []).length,
		NumHash: (url.match(/#/g) || []).length,
		NumNumericChars: countNumericChars(url),
		NoHttps: url.startsWith('https') ? 0 : 1,
		RandomString: hasRandomString(url),
		IpAddress: /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) ? 1 : 0,
		DomainInSubdomains: domainInSubdomains(url),
		DomainInPaths: path.includes('http') || path.includes('www') ? 1 : 0,
		HttpsInHostname: hostname.includes('https') ? 1 : 0,
		HostnameLength: hostname.length,
		PathLength: path.length,
		QueryLength: query.length,
		DoubleSlashInPath: path.includes('//') ? 1 : 0,
		NumSensitiveWords: countSensitiveWords(url),
		PctExtHyperlinks: pctExternalLinks(doc.querySelectorAll('a'), hostname),
		PctExtResourceUrls: pctExternalResources(doc.querySelectorAll('script, link[rel="stylesheet"], img'), hostname),
		InsecureForms: detectInsecureForms(doc.querySelectorAll('form')),
		RelativeFormAction: detectRelativeFormAction(doc.querySelectorAll('form')),
		ExtFormAction: detectExtFormAction(doc.querySelectorAll('form'), hostname),
		AbnormalFormAction: detectAbnormalFormAction(doc),
		FakeLinkInStatusBar: detectFakeLinkStatusBar(doc.querySelectorAll('a')),
		ImagesOnlyInForm: detectImagesOnlyInForms(doc.querySelectorAll('form'))
	}

	return features;
}

document.addEventListener('DOMContentLoaded', () =>
{
	console.log(window.location.href);
});

async function main()
{
	const url = window.location.href;
	const features = await extractFeatures(url);

	console.log(features);

	if (features)
	{
		chrome.runtime.sendMessage({ action: "FEATURES_EXTRACTED", content: features}, function (response)
		{
			if (chrome.runtime.lastError)
			{
				console.log("Error sending message:", chrome.runtime.lastError);
			}
			if(response && response.result)
			{
				showBanner();
			}
			else
			{
				console.log("Response not recieved");
			}
		});
	}
}

main();

function showBanner()
{
	if(document.getElementById("phishingBanner")) return;

	const banner = document.createElement("div");
	banner.id = "phishingBanner";
	banner.innerText = "Acest site este un site de phishing!";

	Object.assign(banner.style, 
		{
			position : "fixed",
			top: "0",
			left: "0",
			width: "100%",
			padding: "12px",
			backgroundColor:"#c62828",
			color: "white",
			fontWeight: "bold",
			fontSize: "16px",
			textAlign: "center",
			zIndex: "9999",
			boxShadow: "0px 2px 10px rgba(0,0,0,0.3)",
			fontFamily: "Arial, sans-serif"
		}
	);

	const closeBtn = document.createElement("span");
	closeBtn.innerText = "✕";

	Object.assign(closeBtn.style,
		{
			position: "absolute",
			right: "15px",
			cursor: "pointer",
			fontSize: "18px"
		}
	);

	closeBtn.addEventListener("click", () => banner.remove());
	banner.appendChild(closeBtn);

	document.body.appendChild(banner);
}