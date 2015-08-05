/**
 * Created by Stephane on 05-Aug-15.
 */
var canvas;
var ctx;
var mysteryPhrase = "Let's try to have this algorithm guess this sentence";
var settings = {
	MAX_POP: 3000,
	MAX_ITER: 500,
	MUTATIONRATE: 0.05,
	CROSSOVER_RATE: 0.8,
	BEST_PARENT_PERCENTAGE: 0.75,
	DELAY_TIME: 1
};

var population = [];
var currentIteration = 0;
var running = false;
var timeout = null;
var delayTime = 100;
var stepButton, runButton, pauseButton, restartButton;
var populationSelect, maxIterationSelect, mutationProbabilitySelect, crossoverProbabilitySelect;
var statslog1, statslog2;

// interval of ASCII characters we can choose from
var min = 32;
var max = 123;
var worseScore = 5000;

function computeWorseScore() {
	var score = 0;
	var size = mysteryPhrase.length;
	for (var i = 0; i < size; i++) {
		var letterValue = mysteryPhrase.charCodeAt(i);
		score += letterValue-32 < max-letterValue ? max-letterValue : letterValue-32;
	}
	return score;
};

function reset() {
	ctx.fillStyle = 'white';
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	$("#message").html("# iteration : 0");
	$("#mystery").html(mysteryPhrase);
	statslog1.html("");
	statslog2.html(0);
	worseScore = computeWorseScore();

	pause();
	start();
}

function run() {
	running = true;
	runButton.attr("disabled", true);
	stepButton.attr("disabled", true);
	pauseButton.attr("disabled", false);
	timeout = setTimeout(step, delayTime);
}

function pause() {
	if (timeout)
		clearTimeout(timeout);

	running = false;
	runButton.attr("disabled", false);
	stepButton.attr("disabled", false);
	pauseButton.attr("disabled", true);
}

function step() {
	if (running) {
		timeout = setTimeout(step, delayTime);
	}
	// just one tick
	update();
}

function start() {
	currentIteration = 0;
	delayTime = settings.DELAY_TIME;
	solutionFound = false;
	if (timeout)
		clearTimeout(timeout);

	initScreen();
	init();
}

function initScreen() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// draw blue band at the top
	ctx.fillStyle = "rgb(0, 0, 255)";
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(canvas.width, 0);
}
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function draw(maxPop) {
	var bestScore = 1000000;
	var currentWorseScore = 0;
	for (var i = 0; i < maxPop; i++) {
		var fit = population[i].fitnessValue;
		if (fit > 255) {
			// default is RED
			ctx.fillStyle = "rgb(255, 0, 0)";
		}
		else {
			var green = 255-fit;
			ctx.fillStyle = green < 0 ? "rgb(255, 165, 0)" : "rgb(" + fit + ", " + green + " , 30)";
		}
		if (fit > currentWorseScore)
			currentWorseScore = fit;
		if (fit < bestScore)
			bestScore = fit;
		var y = Math.floor(canvas.height*fit/(worseScore-worseScore*0.5));
		ctx.fillRect(getRandomInt(0, canvas.width+1), y, 1, 1);
	}
}

function update()
{
	if (!solutionFound && currentIteration < settings.MAX_ITER)
	{
		if (evaluatePopulation() != 0)
		{
			// generate a new batch
			population = generateNewPopulation();
			currentIteration++;
		}
		else {
			solutionFound = true;
		}
	}
	else {
		pause();
	}

	draw(population.length);

	// display best citizen
	report(population[0]);
	$("#message").html("# iteration : " + currentIteration);
}

function init() {
	/*random creation*/
	population = createPopulation();

	// display best citizen
	report(population[0]);
}

function report(bestCitizen) {
	statslog1.html(bestCitizen.str);
	statslog2.html(bestCitizen.fitnessValue);
}

function compareNumbersAscending(x, y) {
	return x.fitnessValue > y.fitnessValue;
}

function createPopulation(size) {
	var pop = [settings.MAX_POP];
	var size = mysteryPhrase.length;
	for (var i = 0; i < settings.MAX_POP; i++)
	{
		var str = "";
		for (var j = 0; j < size; j++)
		{
			str += String.fromCharCode(getRandomInt(32, 123));
		}
		pop[i] = new Citizen(str);
	}

	return pop;
}

function evaluatePopulation() {
	var size = mysteryPhrase.length;
	var maxPop = settings.MAX_POP;
	for (var i = 0; i < maxPop; i++)
	{
		population[i].fitnessValue = 0;
		for (var j = 0; j < size; j++)
		{
			population[i].fitnessValue += Math.abs(population[i].str.charCodeAt(j)-mysteryPhrase.charCodeAt(j));
		}
	}

	population.sort(compareNumbersAscending);
	return population[0].fitnessValue;
}

function generateNewPopulation() {
	var parents = selectParents();
	var sizePop = population.length;
	var numOffspringsToCreate = sizePop - parents.length;

	/*Combine pairs of parents to create offspring (recombination)*/
	var offsprings = createOffsprings(parents, numOffspringsToCreate);
	offsprings = mutatePopulation(offsprings);

	return offsprings;
}

function selectParents() {
	// selects only the first half
	var size = population.length;
	var sizePercentage = Math.floor(size*settings.BEST_PARENT_PERCENTAGE);
	return population.slice(0, sizePercentage);
}

function createOffsprings(parents, numOffspringsToCreate) {
	var offsprings = parents.slice();
	var parentsSize = parents.length;
	var parent1, parent2, crossoverPoint;
	var targetSize = mysteryPhrase.length;
	for (var i = 0; i < numOffspringsToCreate; i++)
	{
		parent1 = parents[getRandomInt(0, parentsSize)];
		if (Math.random() < settings.CROSSOVER_RATE) {
			// mix 2 random parents with one point crossover
			parent2 = parents[getRandomInt(0, parentsSize)];
			crossoverPoint = getRandomInt(0, targetSize);

			// add new offspring
			offsprings.push(new Citizen(parent1.str.substr(0, crossoverPoint) + parent2.str.substr(crossoverPoint)));
		}
		else {
			// offspring is the same as a random parent (since no crossover occured)
			offsprings.push(new Citizen(parent1.str));
		}
	}

	return offsprings;
}

function mutatePopulation(offsprings) {
	var sizePop = offsprings.length;
	var targetSize = mysteryPhrase.length;
	for (var i = 0; i < sizePop; i++)
	{
		// Perform some mutation(s) on the offspring array
		if (Math.random() < settings.MUTATIONRATE)
		{
			var newChar = String.fromCharCode(getRandomInt(32, 122));
			var index = getRandomInt(0, targetSize);
			var newString = offsprings[i].str.substr(0, index) + newChar + offsprings[i].str.substr(index+1);
			offsprings[i].str = newString;
		}
	}
	return offsprings;
}

function changeSetting(name, value) {
	settings[name] = value;
}

function Citizen(sentence) {
	this.str = sentence;
	this.fitnessValue = 0;
};

$(document).ready(function () {
	canvas = document.getElementById("demoGA");
	if ( ! canvas || ! canvas.getContext ) {
		// This browser apparently does not support canvasses since the canvas
		// element has no getContext function.  Give up!
		$("#message").html("Sorry, your browser doesn't support the canvas element!<br>"
			+ "This page should work with recent versions of Firefox, Safari,<br>"
			+ "Chrome, Opera, and Internet Explorer.");
		return;
	}
	ctx = canvas.getContext("2d");
	ctx.strokeStyle = "#FF0000";
	statslog1 = $("#statslog1");
	statslog2 = $("#statslog2");
	runButton = $("#runButton");
	pauseButton = $("#pauseButton");
	stepButton = $("#stepButton");
	restartButton = $("#restartButton");
	stepButton.click(step);
	restartButton.click(reset);
	runButton.click(run);
	pauseButton.click(pause);
	populationSelect = $("#populationSelect");
	populationSelect.val("3000");
	maxIterationSelect = $("#maxIterationSelect");
	maxIterationSelect.val("500");
	mutationProbabilitySelect = $("#mutationProbabilitySelect");
	mutationProbabilitySelect.val("0.05");
	speedOfSimulationSelect = $("#speedOfSimulation");
	speedOfSimulationSelect.val("1");
	crossoverProbabilitySelect = $("#crossoverProbabilitySelect");
	crossoverProbabilitySelect.val("0.8");
	bestParentProbabilitySelect = $("#bestParentProbabilitySelect");
	bestParentProbabilitySelect.val("0.75");
	populationSelect.change(function() { changeSetting("MAX_POP", parseInt(populationSelect.val())); reset(); });
	maxIterationSelect.change(function() { changeSetting("MAX_ITER", parseInt(maxIterationSelect.val())); reset(); });
	mutationProbabilitySelect.change(function() { changeSetting("MUTATIONRATE", parseFloat(mutationProbabilitySelect.val())); reset(); });
	speedOfSimulationSelect.change(function() { changeSetting("DELAY_TIME", parseInt(speedOfSimulationSelect.val())); reset(); });
	crossoverProbabilitySelect.change(function() { changeSetting("CROSSOVER_RATE", parseFloat(crossoverProbabilitySelect.val())); reset(); });
	bestParentProbabilitySelect.change(function() { changeSetting("BEST_PARENT_PERCENTAGE", parseFloat(bestParentProbabilitySelect.val())); reset(); });
	reset();
});