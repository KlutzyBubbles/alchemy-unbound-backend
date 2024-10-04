import { isNumeric } from '../src/router/helpers';

console.log('0---------------------');

console.log(isNumeric('6 seconds'));
console.log(isNumeric('0 something else'));
console.log(isNumeric('6.0 seconds'));
console.log(isNumeric('0.0 something else'));
console.log(isNumeric('5%'));

console.log('1---------------------');

console.log(isNumeric('5.5%'));
console.log(isNumeric('e6 seconds'));
console.log(isNumeric('e0 something else'));
console.log(isNumeric('e6.0 seconds'));
console.log(isNumeric('e0.0 something else'));

console.log('2---------------------');

console.log(isNumeric('e5%'));
console.log(isNumeric('e5.5%'));
console.log(isNumeric('1e6 seconds'));
console.log(isNumeric('1e0 something else'));
console.log(isNumeric('1e6.0 seconds'));

console.log('3---------------------');

console.log(isNumeric('1e0.0 something else'));
console.log(isNumeric('1e5%'));
console.log(isNumeric('1e5.5%'));
console.log(isNumeric('$'));
console.log(isNumeric('NaN'));

console.log('4---------------------');

console.log(isNumeric('Zero'));
console.log(isNumeric('~3'));
console.log(isNumeric('Something 3'));
console.log(isNumeric('Seconds 3'));
console.log(isNumeric('[3]'));

console.log('5---------------------');

console.log(isNumeric('"3"'));
console.log(isNumeric('=3'));
console.log(isNumeric('3='));
console.log(isNumeric('(0)'));
console.log(isNumeric('3?'));
