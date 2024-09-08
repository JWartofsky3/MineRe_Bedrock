import { Vector3, Dimension } from "@minecraft/server";

export const magnitudeVector3 = (vector: Vector3): number => {
  return Math.sqrt(
    vector.x * vector.x + vector.y * vector.y + vector.z * vector.z,
  );
};

export const normalizeVector3 = (vector: Vector3): Vector3 => {
  const magnitude = magnitudeVector3(vector);
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
    z: vector.z / magnitude,
  };
};

export const addVector3 = (a: Vector3, b: Vector3): Vector3 => {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
};

export const subtractVector3 = (a: Vector3, b: Vector3): Vector3 => {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
};

export const multiplyVector3 = (a: Vector3, b: Vector3): Vector3 => {
  return {
    x: a.x * b.x,
    y: a.y * b.y,
    z: a.z * b.z,
  };
};

export const multiplyVector3Number = (a: Vector3, b: number): Vector3 => {
  return {
    x: a.x * b,
    y: a.y * b,
    z: a.z * b,
  };
};

export const divideVector3 = (a: Vector3, b: Vector3): Vector3 => {
  return {
    x: a.x / b.x,
    y: a.y / b.y,
    z: a.z / b.z,
  };
};

export const directionVector3 = (to: Vector3, from: Vector3): Vector3 => {
  return normalizeVector3(subtractVector3(to, from));
};

export const distVector3 = (a: Vector3, b: Vector3): number => {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2),
  );
};

export const randomVector3 = (offset: number): Vector3 => {
  return {
    x: getRandom(offset),
    y: getRandom(offset),
    z: getRandom(offset),
  };
};

const getRandom = (offset: number): number => {
  return -1 * offset + Math.random() * offset * 2;
};

export const getRandomAir = (
  start: Vector3,
  dimension: Dimension,
  offset: number,
  tries: number,
): Vector3 => {
  for (let i = 0; i < tries; i++) {
    const randomPos = addVector3(start, randomVector3(offset));
    if (
      randomPos.y <= dimension.heightRange.min ||
      randomPos.y >= dimension.heightRange.max
    ) {
      continue;
    }
    if (dimension.getBlock(randomPos).isAir) {
      return randomPos;
    }
  }
};
