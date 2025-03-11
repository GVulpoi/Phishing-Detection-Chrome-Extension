//ServiceWorker -- manage all events from all the scripts
console.log("Service worker loaded!");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed!");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
{
    if (!message.action)
    {
        console.log("Recieved message without action! Message ignored!");
        sendResponse({ status: "error"});
        return;
    }

    switch(message.action)
    {
        case "PROCESS_SCRIPTS":
            console.log("Message PROCESS_SCRIPTS recieved. \nStarting processing scripts");
            sendResponse({ status: "success"});
            console.log(message.allScripts);

            //Enabling the scripts
            chrome.declarativeNetRequest.updateEnabledRulesets({
                disableRulesetIds: ["block-scripts"]
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Failed to disable ruleset:", chrome.runtime.lastError);
                    sendResponse({ status: "error", message: chrome.runtime.lastError.message });
                } else {
                    console.log("Ruleset disabled successfully!");
                    sendResponse({ status: "success", message: "Ruleset disabled" });
                }
            });

            return true;

        default:
            console.log("Recieved message with unknown action!");
            sendResponse({ status: "error"});
            return;
    }
}
);