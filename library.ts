// library.ts
import { Readable } from "stream";

export default class Library {
	zero(time: number | string): string {
		const n = typeof time === "number" ? time : parseInt(String(time), 10);
		if (!Number.isFinite(n)) throw new TypeError(`${time} is not a number`);
		return n < 10 ? `0${n}` : String(n);
	}

	now(): string {
		const d = new Date();
		return `${this.zero(d.getHours())}:${this.zero(d.getMinutes())}:${this.zero(d.getSeconds())}`;
	}

	today(): string {
		const d = new Date();
		return `${this.zero(d.getDate())}/${this.zero(d.getMonth() + 1)}/${d.getFullYear()}`;
	}

	caseSense(word: string): string {
		if (typeof word !== "string") throw new TypeError(`${word} is not a string`);
		return word
		.toLowerCase()
		.trim()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/ /g, ".")
		.trim();
	}

	// size=length; min/maj/nbr = inclusions; strong = chars additionnels
	generateRandomPassword(
		size = 16,
		min = true,
		maj = true,
		nbr = true,
		strong?: string
	): string {
		if (!Number.isInteger(size) || size <= 0) throw new TypeError(`${size} must be a positive integer`);

		const lowers = "abcdefghijklmnopqrstuvwxyz";
		const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const digits = "0123456789";
		let chars = "";
		if (min) chars += lowers;
		if (maj) chars += uppers;
		if (nbr) chars += digits;
		if (typeof strong === "string" && strong.length > 0) chars += strong;

		if (chars.length === 0) throw new Error("No character set selected");

		let result = "";
		for (let i = 0; i < size; i++) {
		const idx = Math.floor(Math.random() * chars.length);
		result += chars.charAt(idx);
		}
		return result;
	}

	// arrondi à "decimal" décimales
	rounded(nbr: number, decimal = 0): number {
		if (!Number.isFinite(nbr)) throw new TypeError(`${nbr} is not a number`);
		if (!Number.isInteger(decimal) || decimal < 0) throw new TypeError(`${decimal} must be a non-negative integer`);
		const factor = 10 ** decimal;
		return Math.round(nbr * factor) / factor;
	}

	// supprime doublons
	removeDuplicates<T>(arr: T[]): T[] {
		if (!Array.isArray(arr)) throw new TypeError("Input must be an array");
		return Array.from(new Set(arr));
	}

	// indexOf global
	getAllIndexes<T>(arr: T[], val: T): number[] {
		if (!Array.isArray(arr)) throw new TypeError("First argument must be an array");
		const idxs: number[] = [];
		let i = -1;
		while ((i = arr.indexOf(val, i + 1)) !== -1) idxs.push(i);
		return idxs;
	}

	// nombre aléatoire [min, max), arrondi à "decimals" décimales
	alea(min: number, max: number, decimals = 16): number {
		if (!Number.isFinite(min)) throw new TypeError(`min ${min} is not a number`);
		if (!Number.isFinite(max)) throw new TypeError(`max ${max} is not a number`);
		if (!Number.isInteger(decimals) || decimals < 0) throw new TypeError(`decimals must be a non-negative integer`);
		const x = Math.random() * (max - min) + min;
		return this.rounded(x, decimals);
	}

	// Convertit un Set en Array ; si "attr" est fourni, retourne [{attr: value}, ...]
	convertSetInArray<T>(set: Set<T>, attr?: string): Array<T | Record<string, T>> {
		if (!(set instanceof Set)) throw new TypeError(`${set} must be a Set`);
		const out: Array<T | Record<string, T>> = [];
		for (const value of set.values()) {
			if (attr) out.push({ [attr]: value } as Record<string, T>);
			else out.push(value);
		}
		return out;
	}

	bufferToReadStream(buffer: Buffer): Readable {
		const stream = new Readable();
		stream.push(buffer);
		stream.push(null);
		return stream;
	}
}
