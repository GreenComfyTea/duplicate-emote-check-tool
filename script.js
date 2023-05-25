let DEBUG = false;

const MAX_INT = 2147483647;
const proxy = "https://corsproxy.io/?";

let Channel = {
	info: {
		name: null,
		id: 0,
		emotes: {},
		duplicateEmotes: {}
	},

	loadTwitchEmotes: async function() {
		DEBUG && console.log("[Twitch] Loading Emotes...");

		const twitchToolsUrl = `https://twitch-tools.rootonline.de/emotes.php?channel_id=${Channel.info.id}`

		const htmlString = await getHtml(encodeURIComponent(twitchToolsUrl));
		
		const domParser = new DOMParser();
		const html = domParser.parseFromString(htmlString, 'text/html');

		const emotesFoundCountHtml = html.getElementsByClassName("col-12 mb-3");

		if (emotesFoundCountHtml.length == 0) {
			console.log("[Twitch] No user found!");
			return;
		}

		const emotesFoundCountString = emotesFoundCountHtml[0].textContent;

		if (emotesFoundCountString.includes("No emotes")) {
			console.log("[Twitch] No user found!");
			return;
		}

		const emotesHtml = html.getElementsByClassName("row mb-3")[0];
		const emoteCardsArray = emotesHtml.getElementsByClassName("card-body");

		for (const emoteCard of emoteCardsArray) {
			const emoteNameArray = emoteCard.getElementsByClassName("mt-2 text-center");
			const emoteName = emoteNameArray.length == 0 ? "followerEmote" + Math.floor(Math.random() * MAX_INT) : emoteNameArray[0].textContent;
			
			const imageUrlArray = emoteCard.getElementsByTagName("a"); 
			if (imageUrlArray.length == 0) {
				continue;
			}

			const imageUrl = imageUrlArray[0].href.replace("light","dark");

			const emoteID = imageUrl.split('/')[5];

			const new_emote = {
				name: emoteName,
				id: emoteID,
				type: "Twitch Sub",
				url: imageUrl,
				imageUrl: imageUrl,
				isGlobal: false,
				upscale: false
			};

			if (Channel.info.emotes[emoteName] == undefined) {
				Channel.info.emotes[emoteName] = [new_emote];
			}
			else {
				Channel.info.emotes[emoteName].push(new_emote);
				Channel.info.duplicateEmotes[emoteName] = Channel.info.emotes[emoteName];
			}

			DEBUG && console.log(`[Twitch] ${emoteName}: ${imageUrl}`);
		}

		DEBUG && console.log(`[Twitch] Loading Emotes from ${twitchToolsUrl}: Done!`);
	},

	loadFfzEmotes: async function() {
		DEBUG && console.log("[FFZ] Loading Emotes...");

		const ffzEndpoints = ["emotes/global", `users/twitch/${encodeURIComponent(Channel.info.id)}`];
		for (const endpoint of ffzEndpoints) {
			const json = await getJson(`https://api.betterttv.net/3/cached/frankerfacez/${endpoint}`);

			const isGlobal = endpoint == "emotes/global";
			const globalString = isGlobal ? " GLOBAL" : "";

			if(json.length == 0) {
				console.error(`[FFZ${globalString}] No user found!`);
				continue;
			}

			json.forEach(emote => {
				const url = `https://www.frankerfacez.com/emoticon/${emote.id}`;
				let imageUrl = "";
				let upscale = false;

				if (emote.images["4x"]) {
					imageUrl = emote.images["4x"];
					upscale = false;
				} else {
					imageUrl = emote.images["2x"] || emote.images["1x"];
					upscale = true;
				}

				const new_emote = {
					name: emote.code,
					id: emote.id,
					type: "FFZ",
					url: url,
					imageUrl: imageUrl,
					isGlobal: isGlobal,
					upscale: upscale
				};
	
				if (Channel.info.emotes[emote.code] == undefined) {
					Channel.info.emotes[emote.code] = [new_emote];
				}
				else {
					Channel.info.emotes[emote.code].push(new_emote);
					Channel.info.duplicateEmotes[emote.code] = Channel.info.emotes[emote.code];
				}

				DEBUG && console.log(`[FFZ${globalString}] ${emote.code}: ${url}`);
			});

			DEBUG && console.log(`[FFZ${globalString}] Loading Emotes from ${endpoint}: Done!`);
		}
	},

	loadBttvEmotes: async function() {
		DEBUG && console.log("Loading BTTV Emotes...");

		const bttvEndpoints = ["emotes/global", `users/twitch/${encodeURIComponent(Channel.info.id)}`];
		for (const endpoint of bttvEndpoints) {
			let json = await getJson(`https://api.betterttv.net/3/cached/${endpoint}`);

			const isGlobal = endpoint == "emotes/global";
			const globalString = isGlobal ? " GLOBAL" : "";

			if(json.message != undefined) {
				console.error(`[BTTV${globalString}] Error: ${json.message}`);
				continue;
			}

			if (!Array.isArray(json)) {
				json = json.channelEmotes.concat(json.sharedEmotes);
			}

			json.forEach(emote => {
				const url = `https://betterttv.com/emotes/${emote.id}`;
				const imageUrl = `https://cdn.betterttv.net/emote/${emote.id}/3x`

				const new_emote = {
					name: emote.code,
					id: emote.id,
					type: "BTTV",
					url: url,
					imageUrl: imageUrl,
					isGlobal: isGlobal,
					zeroWidth: ["5e76d338d6581c3724c0f0b2", "5e76d399d6581c3724c0f0b8", "567b5b520e984428652809b6", "5849c9a4f52be01a7ee5f79d", "567b5c080e984428652809ba", "567b5dc00e984428652809bd", "58487cc6f52be01a7ee5f205", "5849c9c8f52be01a7ee5f79e"].includes(emote.id) // "5e76d338d6581c3724c0f0b2" => cvHazmat, "5e76d399d6581c3724c0f0b8" => cvMask, "567b5b520e984428652809b6" => SoSnowy, "5849c9a4f52be01a7ee5f79d" => IceCold, "567b5c080e984428652809ba" => CandyCane, "567b5dc00e984428652809bd" => ReinDeer, "58487cc6f52be01a7ee5f205" => SantaHat, "5849c9c8f52be01a7ee5f79e" => TopHat
				};

				if (Channel.info.emotes[emote.code] == undefined) {
					Channel.info.emotes[emote.code] = [new_emote];
				}
				else {
					Channel.info.emotes[emote.code].push(new_emote);
					Channel.info.duplicateEmotes[emote.code] = Channel.info.emotes[emote.code];
				}

				DEBUG && console.log(`[BTTV${globalString}] ${emote.code}: ${url}`);
			});

			DEBUG && console.log(`[BTTV${globalString}] Loading Emotes from ${endpoint}: Done!`);
		}
	},

	load7tvEmotes: async function() {
		DEBUG && console.log("Loading 7TV Emotes...");

		const _7tvEndpoints = ["emotes/global", `users/${encodeURIComponent(Channel.info.id)}/emotes`];
		for (const endpoint of _7tvEndpoints) {
			const json = await getJson(`https://api.7tv.app/v2/${endpoint}`);

			const isGlobal = endpoint == "emotes/global";
			const globalString = isGlobal ? " GLOBAL" : "";

			if(json.error != undefined) {
				console.error(`[7TV${globalString}] Error: ${json.error}`);
				continue;
			}
			
			json.forEach(emote => {
				const url = `https://7tv.app/emotes/${emote.id}`;
				const imageUrl = emote.urls[emote.urls.length - 1][1];

				const new_emote = {
					name: emote.name,
					id: emote.id,
					type: "7TV",
					url: url,
					imageUrl: imageUrl,
					isGlobal: isGlobal,
					zeroWidth: emote.visibility_simple.includes("ZERO_WIDTH")
				};

				if (Channel.info.emotes[emote.name] == undefined) {
					Channel.info.emotes[emote.name] = [new_emote];
				}
				else {
					Channel.info.emotes[emote.name].push(new_emote);
					Channel.info.duplicateEmotes[emote.name] = Channel.info.emotes[emote.name];
				}

				DEBUG && console.log(`[7TV${globalString}] ${emote.name}: ${url}`);
			});

			DEBUG && console.log(`[7TV${globalString}] Loading Emotes from ${endpoint}: Done!`);
		}
	},

	loadEmotes: async function() {
		Channel.info.emotes = {};
		Channel.info.duplicateEmotes = {};

		DEBUG && console.log("Loading Emotes...");
		
		
		await Channel.loadFfzEmotes();
		await Channel.loadBttvEmotes();
		await Channel.load7tvEmotes();
		await Channel.loadTwitchEmotes();
		
		DEBUG && console.log("Loading Emotes: Done!");
	},

	load: async function() {
		const channelID = await getJson(`https://decapi.me/twitch/id/${Channel.info.name}`);
		if(channelID.includes("User not found")) {
			loading.classList.add("hidden");
			userNotFound.classList.remove("hidden");
			return;
		}

		Channel.info.id = channelID;
		DEBUG && console.log(Channel.info.name + ": " + channelID);
		await Channel.loadEmotes();

		generateHtml();
	},

	init: function(channelName) {
		Channel.info.name = channelName;
		document.title = channelName + " • Dup Emote Check Tool";
		Channel.load();
	}
};

// https://stackoverflow.com/questions/111529/how-to-create-query-parameters-in-javascript
function encodeQueryData(urlParameters) { 
    const encodedUrlParameters = [];
    for (let urlParameter in urlParameters) {
        if (urlParameters[urlParameter]) {
            encodedUrlParameters.push(encodeURIComponent(urlParameter) + '=' + encodeURIComponent(urlParameters[urlParameter]));
		}
    }
    return encodedUrlParameters.join('&');
}

const onReady = (callback) => {
	if (document.readyState != "loading") {
		callback();
	}
	else if (document.addEventListener) {
		document.addEventListener("DOMContentLoaded", callback);
	}
	else {
		document.attachEvent("onreadystatechange", function() {
			if (document.readyState == "complete") {
				callback();
			}
		});
	}
};

const getHtml = (url) => fetch(proxy + url, { method: "GET" }).then(async (response) => {
	const text = await response.text();
	return text;
}).catch((error) => {
	console.error(error);
	return {};
});

const getJson = (url) => fetch(url, { method: "GET" }).then(async (response) => {
	const contentType = response.headers.get("Content-Type");
	if (contentType.includes("text/plain")) {
		const text = await response.text();
		return text;
	} else if (contentType.includes("application/json")) {
		return await response.json();
	}
}).catch((error) => console.error(error));

function calculateDuplicateEmotes(event) {
	if (event != null) {
		event.preventDefault();
	}

	userNotFound.classList.add("hidden");
	noEmoteDuplicates.classList.add("hidden");
	result.classList.add("hidden");
	loading.classList.remove("hidden");
	result.textContent = "";

	const channelName = channel.value;

	let urlParameters = {};
	urlParameters.channel = channelName;

	if (DEBUG) {
		urlParameters.debug = true;
	}

	encodedUrlParameters = encodeQueryData(urlParameters);
	let urlParameterString = `${window.location.pathname}${encodedUrlParameters == "" ? "" : "?"}${encodedUrlParameters}`;

	window.history.pushState(null, "", urlParameterString);

    Channel.init(channelName ? channelName.toLowerCase() : "greencomfytea");
}

function syncGifs() {
	const images = result.getElementsByTagName("img");
	for (const image of images) {
		image.src = image.src;
	}
}

function generateHtml() {
	var noDuplicates = true;

	for(const emote of Object.entries(Channel.info.duplicateEmotes)) {
		noDuplicates = false;

		const emoteDuplicateCard = document.createElement("div");
		emoteDuplicateCard.id = "emote-duplicate-card";
		
		const emoteNameLabel = document.createElement("div");
		emoteNameLabel.id = "emote-name-label";

		const emoteNameText = document.createTextNode(`${emote[0]}`);
	
		emoteNameLabel.appendChild(emoteNameText);
		emoteDuplicateCard.appendChild(emoteNameLabel);
		
		const emoteDuplicateEntities = document.createElement("div");
		emoteDuplicateEntities.id = "emote-duplicate-entities";

		for(const emoteDuplicate of emote[1]) {
			const emoteDuplicateEntity = document.createElement("div");
			emoteDuplicateEntity.id = "emote-duplicate-entity";
			
			const emoteImage = document.createElement("div");
			emoteImage.id = "emote-image-container";

			const emoteLink = document.createElement("a");
			emoteLink.href = `${emoteDuplicate.url}`;

			const image = new Image();
			image.src = emoteDuplicate.imageUrl;
			image.id = "emote-image";

			const sizeTagLabel = document.createElement("div");
			sizeTagLabel.id = "tag-label";
			
			image.onload = function() {
				const sizeTag = document.createTextNode(`${image.naturalWidth}x${image.naturalHeight}`);
				sizeTagLabel.appendChild(sizeTag);
				//sizeTag.value = `${image.naturalWidth}x${image.naturalHeight}`;
			};

			emoteLink.appendChild(image);
			emoteImage.appendChild(emoteLink);

			const submitTagLabel = document.createElement("div");
			submitTagLabel.id = "submit-tag-label";

			const submitButton = document.createElement("input");
			submitButton.type = "button";
			submitButton.onclick = `location.href="${emoteDuplicate.url}"`;
			submitButton.value = `${emoteDuplicate.type}`;

			submitTagLabel.appendChild(submitButton);

			emoteDuplicateEntity.appendChild(emoteImage);
			emoteDuplicateEntity.appendChild(submitTagLabel);
			emoteDuplicateEntity.appendChild(sizeTagLabel);

			if (emoteDuplicate.isGlobal) {
				const globalTagLabel = document.createElement("div");
				globalTagLabel.id = "tag-label";

				const globalTag = document.createTextNode("Global");
				globalTagLabel.appendChild(globalTag);

				emoteDuplicateEntity.appendChild(globalTagLabel);
			}

			emoteDuplicateEntities.appendChild(emoteDuplicateEntity);
		}

		emoteDuplicateCard.appendChild(emoteDuplicateEntities);
		result.appendChild(emoteDuplicateCard);
	}

	if(noDuplicates) {
		loading.classList.add("hidden");
		noEmoteDuplicates.classList.remove("hidden");
	}
	else {
		loading.classList.add("hidden");
		syncGifs();
		result.classList.remove("hidden");
	}

	DEBUG && console.log("All emotes: ");
	DEBUG && console.log(Channel.info.emotes);
	DEBUG && console.log("Duplicate emotes: ");
	DEBUG && console.log(Channel.info.duplicateEmotes);
}

const generator = document.getElementById("generator");
const channel = document.getElementById("channel");
const loading = document.getElementById("loading");
const userNotFound = document.getElementById("user-not-found");
const noEmoteDuplicates = document.getElementById("no-emote-duplicates");
const result = document.getElementById("result");

generator.addEventListener("submit", (event) => calculateDuplicateEmotes(event));

onReady(() => { 
	const searchParameters = new URLSearchParams(window.location.search);
	if(searchParameters.has("debug")) {
		DEBUG = searchParameters.get("debug").toLocaleLowerCase() == "true";
	}

	if(searchParameters.has("channel")) {
		channel.value = searchParameters.get("channel");
		calculateDuplicateEmotes(null);
	}
});