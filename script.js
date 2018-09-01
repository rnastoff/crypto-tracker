$(document).ready(function(){

	let allData;
	let top100 = [];


	//GET  ALL DATA ON LOAD
	function getData() {		
		$.ajax({
			type: 'GET',
			url: 'https://api.coinmarketcap.com/v1/ticker/?limit=0',
			async: false,
			dataType: 'json',
			success: function(data) {
				allData = data;
				for (i=0; i < 100; i++) {
					top100.push(data[i]);
				}	
			}
		});
	}



	//INTEGER - COMMAS AND DOLLAR SIGN
	function handleNum(num, type) {	
		if (num == null) {
			return "N/A";
		}
		if (type == "capVol") {
			num = parseInt(num);
			return "$" + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		} 
		else if (type == "price" ) {
			if (Number(num) < 0.01) {
				return "$" + Number(num).toFixed(6);
			}
			else {
				num = Number(num).toFixed(2);
				return "$" + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			}
		}
		else if (type=="supply") {
			num = parseInt(num);
			return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}			
	}


	//HANDLE PERCENT/RED/GREEN
	function handlePercent(num) {
		if (num != null) {
			if (num < 0) {
				return `<span class="red">${num}%</span>`;
			}
			else {
				return `<span class="green">${num}%</span>`;
			}
		} else {return "N/A"}
	}


	//HANDLE NAME
	function handleName(name) {
		if (name.length > 13) {
			name = name.slice(0,10) + "...";
		}
		return name;
	}


	//BTC ALT PERCENTAGES
	function btcAlt() {		
		let btc = top100.find(function(element){
			if (element.symbol == "BTC") return element;  		
		});
		btc = handlePercent(Number(btc.percent_change_24h));

		let altAvg = 0;
		let nullCheck = 1; //end of array
		for (i=0; i < allData.length; i++) {
			if (allData[i].symbol != "BTC" && allData[i].percent_change_24h != null) {
				altAvg = altAvg + Number(allData[i].percent_change_24h);
			}
			else if (allData[i].percent_change_24h == null) {
				nullCheck++;
			}
		}
		altAvg = handlePercent((altAvg / (allData.length - nullCheck)).toFixed(2));

		let temp = `<span class="btcpercent">BTC ${btc}</span>
								<span class="altpercent">ALT ${altAvg}</span>`;
		$(".percentages").html(temp);				
	}







	//WRAP DATA IN HTML - second arg is all, onehun, custom
	let wrappedAll;
	let wrapped100;
	let wrappedCustom;

	function wrapData(list, type) {
		let temp;
		let chunk = [];
		for (i=0; i < list.length; i++) {		
			let mcap = handleNum(list[i].market_cap_usd, "capVol");
			let price = handleNum(list[i].price_usd, "price");
			let vol = handleNum(list[i]["24h_volume_usd"], "capVol");
			let circ = handleNum(list[i].available_supply, "supply");
			let percent = handlePercent(list[i].percent_change_24h);
			let name = handleName(list[i].name);

			temp = `<ul class="coin">
								<li>
									<div class="rank">${list[i].rank}</div>
									<div class="name">${name}</div>
									<div class="mcap">${mcap}</div>
									<div class="price">${price}</div>
									<div class="volume">${vol}</div>
									<div class="circ">${circ} <span class="blue">${list[i].symbol}</span></div>
									<div class="change">${percent}</div>
								</li>
							</ul>
							<ul class="coin-small">
								<li>
									<div class="rank-small">${list[i].rank}</div>
									<div class="block-small">
										<div class="name-small">${name}</div>
										<div class="price-small-label">Price: <span class="price-small">${price}</span></div>
										<div class="mcap-small-label">Market Cap: <span class="mcap-small">${mcap}</span></div>
									</div>
									<div class="change-small">${percent}</div>
								</li>
							</ul>`;
			chunk.push(temp);
		} //for end

		chunk.join();
		$(".coins").html(chunk);
		
		if (type == "custom") {
			wrappedCustom = chunk;
		}
		else if (list.length == 100) {
			wrapped100 = chunk;
		}
		else if (list.length > 100) {
			wrappedAll = chunk;
		}
		
	} //function end


	getData();
	wrapData(top100);
	btcAlt();
	
	
	//DISPLAY ALL/100 CLICK
	let displaying = "top";
	$("input[name=display]").click(function(e){
		e.preventDefault();	
				
		if ($("input[name=display]").attr("value") == "DISPLAY ALL") {
			if (wrappedAll == undefined) {
				wrapData(allData);
			}
			else {
				$(".coins").html(wrappedAll);
			}
			displaying = "all";
			$("input[name=display]").attr("value", "DISPLAY 100")
		}
		else if ($("input[name=display]").attr("value") == "DISPLAY 100") {
			$(".coins").html(wrapped100);
			displaying = "top";
			$("input[name=display]").attr("value", "DISPLAY ALL")
		}			
	});
	
	
	
	
	
	//SEARCH 
	let searchResults;
	$("input[name=search]").click(function(e){
		e.preventDefault();
		console.log($("input[name=fname]").val());
		
		searchResults = allData.filter(name => {
			const regex = new RegExp($("input[name=fname]").val(), 'gi');
			return name.name.match(regex) || name.symbol.match(regex); 
		});
		console.log(searchResults);
		wrapData(searchResults, "custom");
		displaying = "custom";
	});
	
	
	
	
	
	//CATEGORY CLICK SORT/ASCENDING/DESCENDING
	let nameAsc = false;
	let mcapAsc = true;
	let priceAsc = false;
	let volAsc = false;
	let circAsc = false;
	let changeAsc = false;
	$(".cat").click(function(e){
		
		let sorted;		
		if (displaying == "all") {
			sorted = allData.slice(0);
		}
		else if (displaying == "top") {
  		sorted = top100.slice(0);
		}
		else if (displaying == "custom") {
			sorted = searchResults.slice(0);
		}
		
		//NAME
		if ($(this).hasClass("name")) {
			if (nameAsc == true) {
				sorted.sort(function(a,b) {
					let x = a.name.toLowerCase();
					let y = b.name.toLowerCase();
					return x < y ? -1 : x > y ? 1 : 0;
				});
				nameAsc = false;
			}
			else {
				sorted.sort(function(a,b) {
					let x = a.name.toLowerCase();
					let y = b.name.toLowerCase();
					return x > y ? -1 : x < y ? 1 : 0;
				});
				nameAsc = true;
			}
			wrapData(sorted);
		}
		
		//MCAP & RANK
		if ($(this).hasClass("mcap") || $(this).hasClass("rank")) {			
			if (mcapAsc) { 
				sorted.sort(function(a,b) { return b.rank - a.rank; });
				mcapAsc = false;
			}
			else { 
				sorted.sort(function(a,b) { return a.rank - b.rank; });
				mcapAsc = true;
			}
			wrapData(sorted);			
		}
		
		
		//PRICE
		if ($(this).hasClass("price")) {			
			if (priceAsc) { 
				sorted.sort(function(a,b) { return a.price_usd - b.price_usd; });
				priceAsc = false;
			}
			else { 
				sorted.sort(function(a,b) { return b.price_usd - a.price_usd; });
				priceAsc = true;
			}
			wrapData(sorted);			
		}
		
		//VOLUME
		if ($(this).hasClass("volume")) {			
			if (volAsc) { 
				sorted.sort(function(a,b) { return a["24h_volume_usd"] - b["24h_volume_usd"]; });
				volAsc = false;
			}
			else { 
				sorted.sort(function(a,b) { return b["24h_volume_usd"] - a["24h_volume_usd"]; });
				volAsc = true;
			}
			wrapData(sorted);			
		}
		
		//CIRCULATION
		if ($(this).hasClass("circ")) {			
			if (circAsc) { 
				sorted.sort(function(a,b) { return a.available_supply - b.available_supply; });
				circAsc = false;
			}
			else { 
				sorted.sort(function(a,b) { return b.available_supply - a.available_supply; });
				circAsc = true;
			}
			wrapData(sorted);			
		}
		
		//CHANGE
		if ($(this).hasClass("change")) {			
			if (changeAsc) { 
				sorted.sort(function(a,b) { return a.percent_change_24h - b.percent_change_24h; });
				changeAsc = false;
			}
			else { 
				sorted.sort(function(a,b) { return b.percent_change_24h - a.percent_change_24h; });
				changeAsc = true;
			}
			wrapData(sorted);			
		}				
	}); //click end


	
	
	
	

	












}); //document ready end