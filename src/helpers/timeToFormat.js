const addNull = num => {
	return num >= 0 && num <= 9 ? '0' + num : num;
}
export default duration => {
	duration = Math.floor(parseInt(duration));
	var hours = Math.floor(duration / 3600);
	duration %= 3600;
	var minutes = Math.floor(duration / 60);
	var seconds = duration % 60;

	return `${hours !== 0 ? addNull(hours) + ':' : ''}${addNull(minutes)}:${addNull(seconds)}`;
}