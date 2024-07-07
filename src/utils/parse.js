// Devley
// Developed by Yuvaraja

function cpuCalc(cpu) {
  if (cpu === undefined || cpu === null) return "N/A";
  if (cpu - Math.floor(cpu) === 0) {
    return `${Math.floor(cpu)} %`;
  }
  return `${cpu.toFixed(2)} %`;
}

function bytesCalc(bytes, inf=false) {
  if (bytes === undefined || bytes === null) return "N/A";
  let dataType;
  if (0 <= bytes && bytes < 1024) {
    dataType = 'B';
  } else if (1024 <= bytes && bytes <= 999999) {
    bytes /= 1024;
    dataType = 'KB';
  } else if (999999 < bytes && bytes <= 999999999) {
    bytes /= 1048576;
    dataType = 'MB';
  } else if (999999999 < bytes) {
    bytes /= 1048576000;
    dataType = 'GB';
  }
  if ((bytes == 0) && inf) {
    return '♾️'
  }
  if (bytes - Math.floor(bytes) === 0) {
    return `${Math.floor(bytes)} ${dataType}`;
  }
  return `${bytes.toFixed(2)} ${dataType}`;
}

function megabytesCalc(megabytes, inf=true) {
  if (megabytes === undefined || megabytes === null) return "N/A";
  let data_type;
  if (0 <= megabytes && megabytes <= 1024) {
    data_type = 'MB';
  } else if (1024 <= megabytes && megabytes < 1024100) {
    megabytes /= 1024;
    data_type = 'GB';
  } else if (1024100 <= megabytes) {
    megabytes /= 1048576;
    data_type = 'TB';
  }
  if ((megabytes == 0) && inf) {
    return '♾️'
  }
  if (megabytes - Math.floor(megabytes) === 0) {
    return `${Math.floor(megabytes)} ${data_type}`;
  }
  return `${megabytes.toFixed(2)} ${data_type}`;
}

function formatActiveTime(startTime, endTime = new Date()) {
  if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
    return "0hr 0m 0s";
  }
  const differenceInMs = endTime.getTime() - startTime.getTime();
  if (differenceInMs < 0) {
    return "0hr 0m 0s";
  }
  const differenceInSeconds = Math.floor(differenceInMs / 1000);
  const hours = Math.floor(differenceInSeconds / 3600);
  const minutes = Math.floor((differenceInSeconds % 3600) / 60);
  const seconds = differenceInSeconds % 60;
  return `${hours}hr ${minutes}m ${seconds}s`;
}

export { cpuCalc, bytesCalc, megabytesCalc, formatActiveTime };