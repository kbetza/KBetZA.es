/**
 * Almacenamiento en GitHub via API
 * Guarda y lee archivos JSON del repositorio
 */

const GITHUB_API = 'https://api.github.com';

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  
  if (!token || !repo) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO environment variables');
  }
  
  return { token, repo, branch };
}

function getHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

/**
 * Lee un archivo JSON del repositorio
 */
export async function readFile(path) {
  const { token, repo, branch } = getConfig();
  
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${repo}/contents/${path}?ref=${branch}`,
      { headers: getHeaders(token) }
    );
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    
    return {
      content: JSON.parse(content),
      sha: data.sha
    };
  } catch (error) {
    console.error(`[github] Error reading ${path}:`, error.message);
    return null;
  }
}

/**
 * Escribe un archivo JSON al repositorio
 */
export async function writeFile(path, content, message) {
  const { token, repo, branch } = getConfig();
  
  // Obtener SHA actual si el archivo existe
  const existing = await readFile(path);
  const sha = existing?.sha;
  
  const body = {
    message: message || `Update ${path}`,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    branch
  };
  
  if (sha) {
    body.sha = sha;
  }
  
  const response = await fetch(
    `${GITHUB_API}/repos/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(body)
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }
  
  return true;
}

// ============================================
// PREDICCIONES
// ============================================

const PREDICTIONS_PATH = 'data/predictions-current.json';
const HISTORY_PATH = 'data/history.json';
const REGISTRY_PATH = 'data/bet-registry.json';

export async function getCurrentPredictions() {
  const file = await readFile(PREDICTIONS_PATH);
  return file?.content || { matchday: null, predictions: [] };
}

export async function saveCurrentPredictions(data) {
  return await writeFile(
    PREDICTIONS_PATH, 
    data, 
    `💾 Update predictions - Matchday ${data.matchday || 'unknown'}`
  );
}

export async function addPrediction(prediction) {
  const current = await getCurrentPredictions();
  
  if (!current.matchday) {
    current.matchday = prediction.matchday;
  }
  
  current.predictions.push(prediction);
  current.updatedAt = new Date().toISOString();
  
  return await saveCurrentPredictions(current);
}

// ============================================
// REGISTRO DE APUESTAS (evitar duplicados)
// ============================================

export async function getBetRegistry() {
  const file = await readFile(REGISTRY_PATH);
  return file?.content || { entries: [] };
}

export async function saveBetRegistry(data) {
  return await writeFile(
    REGISTRY_PATH,
    data,
    '📝 Update bet registry'
  );
}

export async function hasPlayerBet(username, matchday) {
  const registry = await getBetRegistry();
  const key = `${username.toLowerCase()}_${matchday}`;
  return registry.entries.includes(key);
}

export async function registerBet(username, matchday) {
  const registry = await getBetRegistry();
  const key = `${username.toLowerCase()}_${matchday}`;
  
  if (!registry.entries.includes(key)) {
    registry.entries.push(key);
    registry.updatedAt = new Date().toISOString();
    await saveBetRegistry(registry);
  }
  
  return true;
}

// ============================================
// HISTORIAL
// ============================================

export async function getHistory() {
  const file = await readFile(HISTORY_PATH);
  return file?.content || { history: [] };
}

export async function saveHistory(data) {
  return await writeFile(
    HISTORY_PATH,
    data,
    '📚 Update history'
  );
}

export async function getPlayerHistory(username) {
  const historyData = await getHistory();
  return historyData.history.filter(
    entry => entry.username.toLowerCase() === username.toLowerCase()
  );
}

export async function archivePredictions(predictionsWithResults) {
  const historyData = await getHistory();
  
  for (const prediction of predictionsWithResults) {
    historyData.history.push(prediction);
  }
  
  historyData.updatedAt = new Date().toISOString();
  
  await saveHistory(historyData);
  await saveCurrentPredictions({ matchday: null, predictions: [], updatedAt: new Date().toISOString() });
  
  return true;
}