const CONTROL_CHARACTERS = /\p{Cc}/gu
const FORMAT_CHARACTERS = /\p{Cf}/gu
const SPACE_BEFORE_PUNCTUATION = /\s+([,.:;!?])/gu
const DUPLICATED_PUNCTUATION = /([,;:])\1+/gu

const scriptureWordRepairs = new Map([
  ['Guardaráslos', 'Guardarás los'],
  ['Ventodo', 'Ven todo'],
  ['SEÑORhabía', 'SEÑOR había'],
  ['Espíritulo', 'Espíritu lo'],
  ['Haganque', 'Hagan que'],
  ['Mipoder', 'Mi poder'],
  ['Puestú', 'Pues tú'],
  ['consagradosque', 'consagrados que'],
  ['holocaustosque', 'holocaustos que'],
  ['devestiduras', 'de vestiduras'],
  ['entiendanque', 'entiendan que'],
  ['entoncestodo', 'entonces todo'],
  ['entreustedes', 'entre ustedes'],
  ['escogidosque', 'escogidos que'],
  ['hicierontodo', 'hicieron todo'],
  ['nosotrosestá', 'nosotros está'],
  ['ustedestiene', 'ustedes tiene'],
  ['comoprofeta', 'como profeta'],
  ['corazóncada', 'corazón cada'],
  ['decíacuando', 'decía cuando'],
  ['entonceslos', 'entonces los'],
  ['escogidosde', 'escogidos de'],
  ['hermanoserá', 'hermano será'],
  ['milagrosque', 'milagros que'],
  ['ofrendaallí', 'ofrenda allí'],
  ['siervospara', 'siervos para'],
  ['apartaráde', 'apartará de'],
  ['aspectodel', 'aspecto del'],
  ['dentrocomo', 'dentro como'],
  ['entoncesel', 'entonces el'],
  ['extremodel', 'extremo del'],
  ['feentonces', 'fe entonces'],
  ['infiernode', 'infierno de'],
  ['ofrendapor', 'ofrenda por'],
  ['palabraste', 'palabras te'],
  ['palaciosde', 'palacios de'],
  ['príncipede', 'príncipe de'],
  ['señalesdel', 'señales del'],
  ['siéntateen', 'siéntate en'],
  ['tendráncon', 'tendrán con'],
  ['acuestade', 'acuesta de'],
  ['ángelesde', 'ángeles de'],
  ['bienescon', 'bienes con'],
  ['comojusto', 'como justo'],
  ['conjuicio', 'con juicio'],
  ['cuandotus', 'cuando tus'],
  ['deciresto', 'decir esto'],
  ['delantede', 'delante de'],
  ['dinerocon', 'dinero con'],
  ['enemigoha', 'enemigo ha'],
  ['hizopara', 'hizo para'],
  ['Israelno', 'Israel no'],
  ['lacabeza', 'la cabeza'],
  ['lasobras', 'las obras'],
  ['llenosde', 'llenos de'],
  ['lospadres', 'los padres'],
  ['mundocomo', 'mundo como'],
  ['nuevasdel', 'nuevas del'],
  ['ofrendade', 'ofrenda de'],
  ['palabrade', 'palabra de'],
  ['seanhijos', 'sean hijos'],
  ['temploque', 'templo que'],
  ['aunqueel', 'aunque el'],
  ['cesadode', 'cesado de'],
  ['Cristoes', 'Cristo es'],
  ['cuandoel', 'cuando el'],
  ['deltemor', 'del temor'],
  ['elhombre', 'el hombre'],
  ['hashecho', 'has hecho'],
  ['kilosde', 'kilos de'],
  ['librolo', 'libro lo'],
  ['lugarcon', 'lugar con'],
  ['mimano', 'mi mano'],
  ['nadiese', 'nadie se'],
  ['nuevaen', 'nueva en'],
  ['nuevono', 'nuevo no'],
  ['paraque', 'para que'],
  ['perdónde', 'perdón de'],
  ['pueblolo', 'pueblo lo'],
  ['puesestá', 'pues está'],
  ['traeel', 'trae el'],
  ['vidaen', 'vida en'],
  ['vidapor', 'vida por'],
  ['vienede', 'viene de'],
  ['aquíel', 'aquí el'],
  ['cuálde', 'cuál de'],
  ['detodo', 'de todo'],
  ['Diosen', 'Dios en'],
  ['espara', 'es para'],
  ['esteen', 'este en'],
  ['findel', 'fin del'],
  ['horaal', 'hora al'],
  ['lahora', 'la hora'],
  ['ledará', 'le dará'],
  ['Perola', 'Pero la'],
  ['perono', 'pero no'],
  ['quehas', 'que has'],
  ['reyque', 'rey que'],
  ['seráel', 'será el'],
  ['sonlos', 'son los'],
  ['sonMis', 'son Mis'],
  ['tomesel', 'tomes el'],
  ['creanen', 'crean en'],
  ['creaque', 'crea que'],
  ['cadadía', 'cada día'],
  ['detodas', 'de todas'],
  ['dueñode', 'dueño de'],
  ['estoses', 'estos es'],
  ['hijosde', 'hijos de'],
  ['delPadreque', 'del Padre que'],
  ['desu', 'de su'],
  ['desus', 'de sus'],
  ['cometeadulterio', 'comete adulterio'],
  ['pequeñani', 'pequeña ni'],
  ['convierteny', 'convierten y'],
  ['atenen', 'aten en'],
  ['seráatado', 'será atado'],
  ['desatenen', 'desaten en'],
  ['serádesatado', 'será desatado'],
  ['creenpor', 'creen por'],
  ['puedecruzar', 'puede cruzar'],
  ['impuestosy', 'impuestos y'],
  ['odresviejos', 'odres viejos'],
  ['odresnuevos', 'odres nuevos'],
  ['severamentey', 'severamente y'],
  ['remiendode', 'remiendo de'],
  ['remiendoal', 'remiendo al'],
  ['cienveces', 'cien veces'],
  ['devolveráacá', 'devolverá acá'],
  ['vencedorserá', 'vencedor será'],
  ['milcarros', 'mil carros'],
  ['podapara', 'poda para'],
  ['soyy', 'soy y'],
  ['dejadosolo', 'dejado solo'],
  ['Élme', 'Él me'],
  ['Míque', 'Mí que'],
  ['Consoladorpara', 'Consolador para'],
  ['Cristopadeciera', 'Cristo padeciera'],
  ['Hadesel', 'Hades el'],
  ['Jeftéy', 'Jefté y'],
  ['Rahaby', 'Rahab y'],
  ['Recibela', 'Recibe la'],
  ['Suéltameporque', 'Suéltame porque'],
  ['Sureinoy', 'Su reino y'],
  ['alforjapara', 'alforja para'],
  ['alzósus', 'alzó sus'],
  ['apartaránpor', 'apartarán por'],
  ['atadoal', 'atado al'],
  ['campoy', 'campo y'],
  ['cuidaráde', 'cuidará de'],
  ['delegacióny', 'delegación y'],
  ['demí', 'de mí'],
  ['denarioal', 'denario al'],
  ['denariosy', 'denarios y'],
  ['deudoresque', 'deudores que'],
  ['discusionesson', 'discusiones son'],
  ['estómagoy', 'estómago y'],
  ['fácily', 'fácil y'],
  ['hondoy', 'hondo y'],
  ['legionesde', 'legiones de'],
  ['levántensey', 'levántense y'],
  ['maduroen', 'maduro en'],
  ['mentesy', 'mentes y'],
  ['minasy', 'minas y'],
  ['mundoy', 'mundo y'],
  ['novioayunen', 'novio ayunen'],
  ['noviopueden', 'novio pueden'],
  ['ovejasy', 'ovejas y'],
  ['pagoy', 'pago y'],
  ['pajarillospor', 'pajarillos por'],
  ['palabrasy', 'palabras y'],
  ['pasarpor', 'pasar por'],
  ['pasepor', 'pase por'],
  ['plantade', 'planta de'],
  ['postraréen', 'postraré en'],
  ['profunday', 'profunda y'],
  ['regirácon', 'regirá con'],
  ['sepaque', 'sepa que'],
  ['sextay', 'sexta y'],
  ['sextodel', 'sexto del'],
  ['siervopuede', 'siervo puede'],
  ['susurradoen', 'susurrado en'],
  ['tardaráen', 'tardará en'],
  ['temploy', 'templo y'],
  ['terrenoy', 'terreno y'],
  ['tentarásal', 'tentarás al'],
  ['tribunalesy', 'tribunales y'],
  ['vestíasy', 'vestías y'],
  ['vividoen', 'vivido en'],
])

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

function replaceWholeWord(text, source, replacement) {
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(source)}(?![\\p{L}\\p{N}])`, 'gu')
  return text.replace(pattern, (_, prefix) => `${prefix}${replacement}`)
}

function normalizeQuoteArtifacts(text) {
  return text
    .replace(/^\s*[-–—]\s*[’”]\s*/u, '»')
    .replace(/^\s*[-–—]\s*»\s*/u, '«')
    .replace(/«{2,}/gu, '«')
    .replace(/»{2,}/gu, '»')
    .replace(/“{2,}/gu, '“')
    .replace(/”{2,}/gu, '”')
    .replace(/([«“])\s+/gu, '$1')
    .replace(/\s+([»”])/gu, '$1')
}

export function normalizeDisplayText(value) {
  if (typeof value !== 'string') return value

  return normalizeQuoteArtifacts(value
    .normalize('NFC')
    .replace(/\u008D/gu, 'ē')
    .replace(CONTROL_CHARACTERS, ' ')
    .replace(FORMAT_CHARACTERS, '')
    .replace(/(^|\s)¶\s*/gu, '$1')
    .replace(/\u00A0/gu, ' ')
    .replace(SPACE_BEFORE_PUNCTUATION, '$1')
    .replace(DUPLICATED_PUNCTUATION, '$1')
    .replace(/\s+/gu, ' ')
    .trim())
}

export function normalizeScriptureText(value) {
  let text = normalizeDisplayText(value)
  if (typeof text !== 'string') return text

  for (const [source, replacement] of scriptureWordRepairs) {
    text = replaceWholeWord(text, source, replacement)
  }

  return text
    .replace(/\bqueme (?=(?:envió|diste)(?!\p{L}))/gu, 'que me ')
    .replace(/\bmás honrara su padre\b/gu, 'más honrar a su padre')
    .replace(/\brecompensara cada uno\b/gu, 'recompensar a cada uno')
    .replace(/\biSaúl\b/gu, 'Saúl')
    .replace(/\[treinta\]j(?=\s+años?\b)/gu, '[treinta]')
    .replace(/\bdosk(?=\s+años?\b)/gu, 'dos')
    .replace(/\baEn el tercer año\b/gu, 'En el tercer año')
    .replace(/([\p{Ll}\p{M}])(?=\p{Lu})/gu, '$1 ')
    .replace(/([\p{Ll}\p{M}][.!?])(?=\p{Lu})/gu, '$1 ')
}

const COMMENTARY_RTF_666 = /Times New Roman;Calibri;Georgia;+\*Riched20[^]*?V5I1C100[^]*?I1666/gu

export function normalizeCommentaryText(value) {
  let text = normalizeDisplayText(value)
  if (typeof text !== 'string') return text

  if (COMMENTARY_RTF_666.test(text)) {
    COMMENTARY_RTF_666.lastIndex = 0
    return 'V (5) + I (1) + C (100) + I (1) + V (5) + I (1) + L (50) + I (1) + I (1) + D (500) + I (1) = 666.'
  }
  COMMENTARY_RTF_666.lastIndex = 0

  return text
    .replace(/\be1\b/gu, 'el')
    .replace(/\bcomo como\b/giu, 'como')
    .replace(/\bsostiene sostiene\b/giu, 'sostiene')
    .replace(/\bmás que que humana\b/giu, 'más que humana')
    .replace(/\bJeremías Jeremías\b/gu, 'Jeremías')
    .replace(/Si bien algunos MSS dicen 616 y,\s*/gu, 'Si bien algunos MSS dicen 616, ')
    .replace(/Desde los días de 338 Helwig/gu, 'Desde los días de Helwig')
}

export function normalizeCommentaryData(value) {
  if (typeof value === 'string') return normalizeCommentaryText(value)
  if (Array.isArray(value)) return value.map(normalizeCommentaryData)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, normalizeCommentaryData(entry)]),
  )
}
