import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import { Station } from '../types/Station';
import { Line } from '../types/Line';
import { Train } from '../types/Train';
import { GameState } from '../types/GameState';

const Sketch: React.FC = () => {
  const sketchRef = useRef<HTMLDivElement>(null);
  const stations: Station[] = [];
  const lines: Line[] = [];
  const trains: Train[] = [];
  const TRAIN_SPEED = 0.005;
  const MAX_PASSENGERS = 8;
  const DAY_DURATION = 1000; // 1 second per day
  const STATION_COLORS = {
    circle: '#FF6B6B',
    square: '#4ECDC4',
    triangle: '#45B7D1'
  };
  
  const gameState: GameState = {
    score: 0,
    gameOver: false,
    day: 1,
    timeUntilNextDay: DAY_DURATION,
    stationOverflowCount: 0
  };

  const sketch = (p: p5) => {
    let bgPattern: p5.Graphics;

    p.setup = () => {
      p.createCanvas(800, 600);
      setupInitialStations();
      createBackgroundPattern();
    };

    const createBackgroundPattern = () => {
      bgPattern = p.createGraphics(40, 40);
      bgPattern.background(240);
      bgPattern.stroke(230);
      bgPattern.strokeWeight(1);
      bgPattern.line(0, 0, 40, 40);
      bgPattern.line(40, 0, 0, 40);
    };

    const setupInitialStations = () => {
      const centerX = p.width / 2;
      const centerY = p.height / 2;
      const radius = 150;
      const types: Array<Station['type']> = ['circle', 'square', 'triangle'];
      
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * p.TWO_PI;
        stations.push({
          x: centerX + p.cos(angle) * radius,
          y: centerY + p.sin(angle) * radius,
          type: types[i % 3],
          passengers: 0
        });
      }
    };

    const lerp = (start: number, end: number, amt: number) => {
      return (1 - amt) * start + amt * end;
    };

    const updateGameState = () => {
      if (gameState.gameOver) return;

      gameState.timeUntilNextDay -= p.deltaTime;
      
      if (gameState.timeUntilNextDay <= 0) {
        gameState.day++;
        gameState.timeUntilNextDay = DAY_DURATION;
        
        if (gameState.day % 5 === 0) {
          const angle = p.random(p.TWO_PI);
          const radius = 200 + p.random(100);
          const types: Array<Station['type']> = ['circle', 'square', 'triangle'];
          stations.push({
            x: p.width/2 + p.cos(angle) * radius,
            y: p.height/2 + p.sin(angle) * radius,
            type: types[Math.floor(p.random(3))],
            passengers: 0
          });
        }

        gameState.score += trains.reduce((acc, train) => acc + train.deliveredPassengers, 0);
        trains.forEach(train => train.deliveredPassengers = 0);
      }

      gameState.stationOverflowCount = stations.filter(s => s.passengers >= MAX_PASSENGERS).length;
      if (gameState.stationOverflowCount >= 3) {
        gameState.gameOver = true;
      }
    };

    const updateTrains = () => {
      if (gameState.gameOver) return;

      trains.forEach(train => {
        const line = lines[train.lineIndex];
        if (!line || line.stations.length < 2) return;

        train.position += TRAIN_SPEED * train.direction;

        if (train.position >= 1) {
          train.position = 1;
          train.direction = -1;
        } else if (train.position <= 0) {
          train.position = 0;
          train.direction = 1;
        }

        const segmentLength = 1 / (line.stations.length - 1);
        const currentSegment = Math.floor(train.position / segmentLength);

        if (Math.abs(train.position % segmentLength) < TRAIN_SPEED) {
          const currentStation = line.stations[currentSegment];
          
          const initialPassengers = train.passengers.length;
          train.passengers = train.passengers.filter(passengerType => {
            if (passengerType === currentStation.type) {
              train.deliveredPassengers++;
              return false;
            }
            return true;
          });
          const deliveredCount = initialPassengers - train.passengers.length;
          if (deliveredCount > 0) {
            train.showDeliveryEffect = true;
            setTimeout(() => { train.showDeliveryEffect = false; }, 500);
          }

          while (currentStation.passengers > 0 && train.passengers.length < train.capacity) {
            train.passengers.push(currentStation.type);
            currentStation.passengers--;
          }
        }
      });
    };

    const drawTrains = () => {
      trains.forEach(train => {
        const line = lines[train.lineIndex];
        if (!line || line.stations.length < 2) return;

        const segmentLength = 1 / (line.stations.length - 1);
        const currentSegment = Math.floor(train.position / segmentLength);
        const segmentPosition = (train.position % segmentLength) / segmentLength;
        
        const start = line.stations[currentSegment];
        const end = line.stations[currentSegment + 1];
        
        if (start && end) {
          const x = lerp(start.x, end.x, segmentPosition);
          const y = lerp(start.y, end.y, segmentPosition);

          // Draw delivery effect
          if (train.showDeliveryEffect) {
            p.noFill();
            p.stroke(255, 215, 0);
            p.strokeWeight(2);
            const effectSize = 30 + p.sin(p.frameCount * 0.2) * 10;
            p.circle(x, y, effectSize);
            p.circle(x, y, effectSize * 0.7);
          }

          // Draw train shadow
          p.noStroke();
          p.fill(0, 30);
          p.ellipse(x + 2, y + 4, 24, 10);

          // Draw train body
          p.fill(line.color);
          p.stroke(p.color(p.red(p.color(line.color)) * 0.8, 
                         p.green(p.color(line.color)) * 0.8, 
                         p.blue(p.color(line.color)) * 0.8));
          p.strokeWeight(1);
          p.rect(x - 10, y - 7, 20, 14, 4);

          // Draw passengers
          if (train.passengers.length > 0) {
            p.noStroke();
            p.fill(40);
            const passengerWidth = 16 / train.capacity;
            train.passengers.forEach((type, i) => {
              p.fill(STATION_COLORS[type]);
              p.rect(x - 8 + i * passengerWidth, y - 5, passengerWidth - 1, 4, 1);
            });
          }
        }
      });
    };

    const drawGameInfo = () => {
      // Draw background for UI
      p.fill(255, 240);
      p.noStroke();
      p.rect(0, 0, p.width, 50);
      
      p.fill(40);
      p.noStroke();
      p.textSize(16);
      p.textAlign(p.LEFT, p.CENTER);
      p.text('Day: ' + gameState.day, 20, 25);
      p.text('Score: ' + gameState.score, 120, 25);
      
      // Draw station type legend
      p.textAlign(p.RIGHT, p.CENTER);
      Object.entries(STATION_COLORS).forEach(([type, color], i) => {
        p.fill(color as string);
        p.stroke(40);
        p.strokeWeight(1);
        if (type === 'circle') p.circle(p.width - 160 + i * 60, 25, 16);
        else if (type === 'square') p.square(p.width - 168 + i * 60, 17, 16);
        else p.triangle(p.width - 160 + i * 60, 17, 
                       p.width - 168 + i * 60, 33, 
                       p.width - 152 + i * 60, 33);
      });
      
      if (gameState.gameOver) {
        p.fill(0, 0, 0, 150);
        p.rect(0, 0, p.width, p.height);
        p.fill(255);
        p.noStroke();
        p.textSize(48);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('Game Over!', p.width/2, p.height/2 - 40);
        p.textSize(24);
        p.text('Final Score: ' + gameState.score, p.width/2, p.height/2 + 20);
        p.textSize(16);
        p.text('Click anywhere to restart', p.width/2, p.height/2 + 60);
      }
    };

    p.draw = () => {
      // Draw background pattern
      p.background(240);
      for (let x = 0; x < p.width; x += 40) {
        for (let y = 0; y < p.height; y += 40) {
          p.image(bgPattern, x, y);
        }
      }
      
      updateGameState();
      updateTrains();
      
      // Draw lines with subtle glow
      lines.forEach(line => {
        // Draw glow
        p.stroke(p.color(line.color + '80'));
        p.strokeWeight(8);
        for (let i = 0; i < line.stations.length - 1; i++) {
          const current = line.stations[i];
          const next = line.stations[i + 1];
          p.line(current.x, current.y, next.x, next.y);
        }
        // Draw main line
        p.stroke(line.color);
        p.strokeWeight(4);
        for (let i = 0; i < line.stations.length - 1; i++) {
          const current = line.stations[i];
          const next = line.stations[i + 1];
          p.line(current.x, current.y, next.x, next.y);
        }
      });

      // Draw stations
      stations.forEach(station => {
        // Draw warning for nearly full stations
        if (station.passengers >= MAX_PASSENGERS - 2) {
          p.noFill();
          p.stroke(255, 0, 0, 128 + p.sin(p.frameCount * 0.1) * 128);
          p.strokeWeight(2);
          const warningSize = 40 + p.sin(p.frameCount * 0.1) * 5;
          p.circle(station.x, station.y, warningSize);
          p.circle(station.x, station.y, warningSize * 0.7);
        }

        // Draw station shadow
        p.noStroke();
        p.fill(0, 30);
        p.ellipse(station.x + 2, station.y + 4, 34, 12);

        // Draw station
        p.strokeWeight(2);
        p.stroke(40);
        p.fill(255);
        
        switch (station.type) {
          case 'circle':
            p.circle(station.x, station.y, 30);
            break;
          case 'square':
            p.rectMode(p.CENTER);
            p.square(station.x, station.y, 30);
            break;
          case 'triangle':
            p.triangle(
              station.x, station.y - 15,
              station.x - 15, station.y + 15,
              station.x + 15, station.y + 15
            );
            break;
        }

        // Draw station type indicator
        p.noStroke();
        p.fill(STATION_COLORS[station.type]);
        switch (station.type) {
          case 'circle':
            p.circle(station.x, station.y, 10);
            break;
          case 'square':
            p.rectMode(p.CENTER);
            p.square(station.x, station.y, 10);
            break;
          case 'triangle':
            p.triangle(
              station.x, station.y - 5,
              station.x - 5, station.y + 5,
              station.x + 5, station.y + 5
            );
            break;
        }

        // Draw passenger count
        if (station.passengers > 0) {
          const fillColor = station.passengers >= MAX_PASSENGERS - 2 ? 
            p.color(255, 0, 0) : p.color(40);
          p.fill(255);
          p.stroke(40);
          p.strokeWeight(1);
          p.circle(station.x + 15, station.y - 15, 20);
          p.noStroke();
          p.fill(fillColor);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(12);
          p.text(station.passengers, station.x + 15, station.y - 15);
        }
      });

      drawTrains();
      drawGameInfo();
    };

    // Add passengers randomly
    setInterval(() => {
      if (!gameState.gameOver) {
        const randomStation = stations[Math.floor(p.random(stations.length))];
        if (randomStation.passengers < MAX_PASSENGERS) {
          randomStation.passengers++;
        }
      }
    }, 2000);

    p.mousePressed = () => {
      if (gameState.gameOver) {
        // Reset game
        stations.length = 0;
        lines.length = 0;
        trains.length = 0;
        gameState.score = 0;
        gameState.gameOver = false;
        gameState.day = 1;
        gameState.timeUntilNextDay = DAY_DURATION;
        gameState.stationOverflowCount = 0;
        setupInitialStations();
        return;
      }

      const clickedStation = stations.find(station => 
        p.dist(p.mouseX, p.mouseY, station.x, station.y) < 20
      );

      if (clickedStation) {
        const lineIndex = lines.length;
        const hue = p.random(360);
        const newLine: Line = {
          stations: [clickedStation],
          color: 'hsl(' + hue + ', 80%, 60%)'
        };
        lines.push(newLine);

        trains.push({
          lineIndex,
          position: 0,
          direction: 1,
          passengers: [],
          capacity: 4,
          deliveredPassengers: 0,
          showDeliveryEffect: false
        });
      }
    };

    p.mouseDragged = () => {
      if (gameState.gameOver) return;

      if (lines.length > 0) {
        const currentLine = lines[lines.length - 1];
        const clickedStation = stations.find(station => 
          p.dist(p.mouseX, p.mouseY, station.x, station.y) < 20 &&
          !currentLine.stations.includes(station)
        );

        if (clickedStation) {
          currentLine.stations.push(clickedStation);
        }
      }
    };
  };

  useEffect(() => {
    if (sketchRef.current) {
      new p5(sketch, sketchRef.current);
    }
  }, []);

  return <div ref={sketchRef} className="border border-gray-300 rounded-lg shadow-lg" />;
};

export default Sketch;