export enum Currency {
  ZAR = 'ZAR',
  USD = 'USD',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  INVESTMENT = 'INVESTMENT',
  BUSINESS = 'BUSINESS',
  CRYPTO = 'CRYPTO',
}

export enum AccountProvider {
  FNB = 'FNB',
  STANDARD_BANK = 'STANDARD_BANK',
  ABSA = 'ABSA',
  NEDBANK = 'NEDBANK',
  CAPITEC = 'CAPITEC',
  INVESTEC = 'INVESTEC',
  EASY_EQUITIES = 'EASY_EQUITIES',
  ALLAN_GRAY = 'ALLAN_GRAY',
  SATRIX = 'SATRIX',
  LUNO = 'LUNO',
  VALR = 'VALR',
  BINANCE = 'BINANCE',
  MANUAL = 'MANUAL',
}

export enum BalanceSource {
  MANUAL = 'MANUAL',
  BANK_SYNC = 'BANK_SYNC',
  INTEGRATION = 'INTEGRATION',
  CALCULATION = 'CALCULATION',
}