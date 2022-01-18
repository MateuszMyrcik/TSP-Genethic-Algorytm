fs = require("fs");
let bestDNA = [];

// utils

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const arrayReverse = (arr, index, length) => {
  let temp = arr.slice(index, index + length);
  temp.reverse();

  for (let i = 0, j = index; i < temp.length, j < index + length; i++, j++) {
    arr[j] = temp[i];
  }

  return arr;
};

const getDistance = (a, b) => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

const getWholeDistance = (DNA) => {
  let distance = 0;
  DNA.forEach((gen, index) => {
    if (DNA.length - 1 === index) {
      return;
    }

    distance += getDistance(gen, DNA[index + 1]);
  });

  return distance;
};

// Sp - wspolczynnik selekcji  Sp => [1.0 ;2.0]
// N - liczba wybieranych osobnikow
// rank - pozycja na liscie rankingowej
const linearRankingValue = (rank, N) => {
  const Sp = 2;
  return 2 - Sp + (2 * (Sp - 1) * (rank - 1)) / (N - 1);
};

const insertIntoArray = (arr, index, ...newItems) => [
  // part of the array before the specified index
  ...arr.slice(0, index),
  // inserted items
  ...newItems,
  // part of the array after the specified index
  ...arr.slice(index),
];

const crossOverDNA = (p1, p2, sub, crossIndex) => {
  let candidateDNA = [
    ...p2.splice(crossIndex, p2.length),
    ...p2.splice(0, crossIndex),
  ];

  candidateDNA = candidateDNA.filter((item) => {
    if (sub.includes(item)) {
      return;
    }

    return item;
  });

  candidateDNA = insertIntoArray(candidateDNA, crossIndex, ...sub);
  return candidateDNA;
};

const shuffle = (array) => {
  let currentIndex = array.length;
  let randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

const swap = (a, i, j) => {
  var temp = a[i];
  a[i] = a[j];
  a[j] = temp;
};

// GA
const getCities = async (filePath) => {
  const data = await fs.readFileSync(filePath, "utf8", function (err, data) {
    if (err) {
      return console.log(err);
    }

    return convertTSPToArray(data);
  });

  return data;
};

const convertTSPToArray = (tspText) => {
  return tspText
    .split("NODE_COORD_SECTION")[1]
    .split("EOF")[0]
    .trim()
    .split("\n")
    .map((cordString) => cordString.trim().split(" "))
    .map((cordArr) => cordArr.filter((cordCandidate) => cordCandidate !== ""))
    .map((cordArr) => {
      return {
        index: cordArr[0] - 1,
        x: Number(cordArr[1]),
        y: Number(cordArr[2]),
      };
    });
};

const initPopulation = (cities, populationAmount) => {
  const population = [];

  for (let i = 0; i < populationAmount; i++) {
    population.push(cities);
  }

  return population;
};

const crossOver1 = (population, populationAmount, crossProbability) => {
  // TODO: it should be placed during crossing process
  if (Math.random() > crossProbability) {
    return population;
  }

  const crossOverPopulation = [];
  const crossedAmountOfGens = 5;
  const shuffledPopulation = shuffle([...population]);

  const DNALength = population[0].length - 1; // counting from 0 index

  const crossingStart =
    Math.floor(Math.random() * 10 + crossedAmountOfGens) - crossedAmountOfGens;

  // const before = shuffledPopulation.map((DNA) =>
  //   DNA.map((item) => item.index).join(" ")
  // );
  // console.log(crossingStart, "crossingStart");
  // console.log("before", before[0]);

  for (let i = 0; i < populationAmount; i += 2) {
    let DNAFirst = shuffledPopulation[i];
    let DNASecond = shuffledPopulation[i + 1];

    const crossedGenesFirst = [...DNAFirst].splice(
      crossingStart,
      crossedAmountOfGens
    );

    const crossedGenesSecond = [...DNASecond].splice(
      crossingStart,
      crossedAmountOfGens
    );

    crossOverPopulation.push(
      crossOverDNA(
        [...DNASecond],
        [...DNAFirst],
        crossedGenesSecond,
        crossingStart
      )
    );

    crossOverPopulation.push(
      crossOverDNA(
        [...DNAFirst],
        [...DNASecond],
        crossedGenesFirst,
        crossingStart
      )
    );
  }

  // const after = crossOverPopulation.map((DNA) =>
  //   DNA.map((item) => item.index).join(" ")
  // );
  // console.log("after", after[0]);

  return crossOverPopulation;
};

const crossOver = (population, populationAmount, crossProbability) => {
  // TODO: it should be placed during crossing process
  if (Math.random() > crossProbability) {
    return population;
  }

  const crossOverPopulation = [];
  const shuffledPopulation = shuffle([...population]);

  // const before = shuffledPopulation.map((DNA) =>
  //   DNA.map((item) => item.index).join(" ")
  // );
  // console.log(crossingStart, "crossingStart");
  // console.log("before", before[0]);

  for (let i = 0; i < populationAmount; i += 2) {
    let DNAFirstParent = shuffledPopulation[i];
    let DNASecondParent = shuffledPopulation[i + 1];

    crossOverPopulation.push(crossOverFun(DNAFirstParent, DNASecondParent));
    crossOverPopulation.push(crossOverFun(DNASecondParent, DNAFirstParent));
  }

  return crossOverPopulation;
};

const crossOverFun = (orderA, orderB) => {
  const randomNumbers = [
    Math.floor(Math.random() * 144),
    Math.floor(Math.random() * 144),
  ];

  const start = Math.min(...randomNumbers);
  const end = Math.max(...randomNumbers);

  const newOrder = orderA.slice(start, end);

  for (let i = 0; i < orderB.length; i++) {
    const city = orderB[i];

    if (!newOrder.includes(city)) {
      newOrder.push(city);
    }
  }

  return newOrder;
};

const mutateDNA = (DNA) => {
  const numberOfGenes = 5;
  const randomIndex = getRandomInt(0, DNA.length - numberOfGenes);

  const mutatedDNA = arrayReverse([...DNA], randomIndex, numberOfGenes);

  return mutatedDNA;
};

const mutation = (population, mutationProbability) => {
  const mutatedPopulation = [];

  for (let i = 0; i < population.length; i++) {
    if (Math.random() > mutationProbability) {
      mutatedPopulation.push(population[i]);
    } else {
      mutatedPopulation.push(mutateDNA(population[i]));
    }
  }

  return mutatedPopulation;
};

const selection = (population) => {
  const distances = [];

  [...population].forEach((DNA, index) => {
    let distance = 0;

    DNA.forEach((gen, index) => {
      if (DNA.length - 1 === index) {
        return;
      }

      distance += getDistance(gen, DNA[index + 1]);
    });

    distances.push({ distance, index: index });
  });

  distances
    .sort((a, b) => {
      return a.distance - b.distance;
    })
    .reverse()
    .map((DNA, index) => {
      DNA.probability =
        linearRankingValue(index + 1, population.length) / population.length;

      return DNA;
    })
    .reverse();

  //   console.log(
  //   "best from population:",
  //   distances[population.length - 1].distance
  // );

  return population
    .sort((a, b) => getWholeDistance(a) - getWholeDistance(b))
    .map((DNA, index) => {
      const randomInt = Math.random();
      let accumulator = 0;
      let newDNaIndex;

      if (index === 0 && getWholeDistance(bestDNA) < getWholeDistance(DNA)) {
        return bestDNA;
      } else if (index === 0) {
        bestDNA = DNA;

        return DNA;
      }

      if (index < population.length * 0.2) {
        return DNA;
      }

      distances.some((distance, index) => {
        accumulator += distance.probability;

        if (randomInt < accumulator) {
          newDNaIndex = distance.index;
          return true;
        }
      });

      return population[newDNaIndex];
    });
};

const init = async () => {
  let execution = true;

  let executionNumb = 3; //	liczba	uruchomień	programu
  let oneExecutionTime = 600000; // in ms
  let populationAmount = 50; // liczba	populacji
  let crossProbability = 0.8; // prawdopodobieństwo	krzyżowania
  let mutationProbability = 0.15; // prawdopodobieństwo	mutacji

  let population = [];
  let results = "";

  let filePath = process.argv[2] || "./dane/pr144.tsp";

  const cities = await getCities(filePath).then((data) => {
    return convertTSPToArray(data);
  });

  // population = initPopulation(cities, populationAmount);

  // population = population.map((DNA) => {
  //   return shuffle([...DNA]);
  // });

  for (let i = 0; i < executionNumb; i++) {
    const scriptStart = Date.now();

    population = [];
    population = initPopulation(cities, populationAmount);

    population = population.map((DNA) => {
      return shuffle([...DNA]);
    });

    bestDNA = population[0];

    while (execution) {
      population = mutation(population, mutationProbability);
      population = crossOver(population, populationAmount, crossProbability);
      population = selection(population);

      // console.log("best from DNA:", getWholeDistance(population[0]));
      if (Date.now() - scriptStart > oneExecutionTime) {
        debugger;
        execution = false;

        let route = population[0].map((point) => point.index).join(" ");

        results += `${route} ${getWholeDistance(population[0])} \n`;
      }
    }

    execution = true;
    fs.writeFileSync("results.txt", results);
  }
};

init();
