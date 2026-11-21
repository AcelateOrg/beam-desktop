package settings

import (
	domainSettings "beam-bridge/core/domain/settings"
)

// Настройки ядра Xray и DNS. Валидацию и нормализацию
// делает репозиторий; новые значения применяются при следующем запуске
// ядра (переподключении).

func (s *Service) GetCore() domainSettings.CoreSettings {
	return s.repo.Get().Core
}

func (s *Service) UpdateCore(core domainSettings.CoreSettings) error {
	return s.repo.UpdateCore(core)
}

func (s *Service) GetDNS() domainSettings.DNSSettings {
	return s.repo.Get().DNS
}

func (s *Service) UpdateDNS(dns domainSettings.DNSSettings) error {
	return s.repo.UpdateDNS(dns)
}
