const symptomMap = {
  fever: ['General Physician'],
  cold: ['General Physician', 'ENT Specialist'],
  cough: ['General Physician'],
  skin: ['Dermatologist'],
  rash: ['Dermatologist'],
  acne: ['Dermatologist'],
  child: ['Pediatrician'],
  pregnancy: ['Gynecologist'],
  periods: ['Gynecologist'],
  ear: ['ENT Specialist'],
  throat: ['ENT Specialist'],
  bone: ['Orthopedic'],
  joint: ['Orthopedic'],
  teeth: ['Dentist'],
  tooth: ['Dentist'],
}

export async function suggestSpecialties(req, res) {
  const symptomsStr = String(req.body?.symptoms || '').toLowerCase()
  // Split by space, comma, or period
  const words = symptomsStr.split(/[ ,./]+/).filter(Boolean)

  const specialtiesSet = new Set()

  for (const word of words) {
    if (symptomMap[word]) {
      symptomMap[word].forEach((s) => specialtiesSet.add(s))
    }
  }

  let result = Array.from(specialtiesSet)
  if (result.length === 0) {
    result = ['General Physician']
  }

  return res.json({
    success: true,
    data: { specialties: result },
    message: 'OK',
    error: '',
  })
}
