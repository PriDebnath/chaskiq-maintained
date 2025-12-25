
require_relative "../chaskiq_boot.rb"

if defined?(Rails::Server) || defined?(Rails::Console) || Sidekiq.server?
  # Only run once on boot, not on every request
  Rails.application.config.after_initialize do
    # Skip eager loading in development to avoid blocking requests
    unless Rails.env.development?
      Rails.application.eager_load!
    end
    ChaskiqBoot.plugin_autoloader
  end
end