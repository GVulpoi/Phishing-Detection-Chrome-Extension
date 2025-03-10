//ServiceWorker -- manage all events from all the scripts
console.log("Service worker loaded!");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed!");
});

chrome.runtime.onMessage.addListener((message, sender, response) =>
{
    if (!message.action)
    {
        console.log("Recieved message without action! Message ignored!");
        return;
    }

    switch(message.action)
    {
        case "PROCESS_SCRIPTS":
            console.log("Message PROCESS_SCRIPTS recieved. \nStarting processing scripts");
            sendResponse({ status: "success"});
            console.log(message.allScripts);

            return true;

        default:
            console.log("Recieved message with unknown action!");
            return;
    }
}
);