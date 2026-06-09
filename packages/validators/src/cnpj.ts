export function validarCNPJ(cnpj: string): boolean {
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (c: string, len: number) => {
    let sum = 0, pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(c[len - i]!) * pos--;
      if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };
  return calc(c, 12) === parseInt(c[12]!) && calc(c, 13) === parseInt(c[13]!);
}

export function validarCPF(cpf: string): boolean {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  const calc = (c: string, len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(c[i]!) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 || rest === 11 ? 0 : rest;
  };
  return calc(c, 9) === parseInt(c[9]!) && calc(c, 10) === parseInt(c[10]!);
}
