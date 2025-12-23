# frozen_string_literal: true

# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)
require 'app_packages_catalog'

domain = ENV['HOST'] || 'http://localhost:3000'

AppPackagesCatalog.update_all unless Rails.env.test?

app = App.find_or_initialize_by(name: 'test app')
if app.new_record?
  app.domain_url = domain
  app.save
end

# Ensure the OAuth client used by the frontend exists and is public (no secret required)
oauth_app = Doorkeeper::Application.find_or_initialize_by(name: 'authapp')
oauth_app.confidential = false
# oauth_app.redirect_uri = "#{domain}/callback"
oauth_app.save!

# Create a default admin agent if ADMIN_EMAIL is set and agent doesn't exist
admin_email = Chaskiq::Config.fetch("ADMIN_EMAIL", nil)
admin_password = Chaskiq::Config.fetch("ADMIN_PASSWORD", "password123")

if admin_email.present? && !Agent.exists?(email: admin_email)
  app.add_admin(
    email: admin_email,
    password: admin_password
  )
  puts "Created admin agent: #{admin_email}"
elsif admin_email.blank?
  # Create a default test agent if no ADMIN_EMAIL is configured
  default_email = "admin@example.com"
  unless Agent.exists?(email: default_email)
    app.add_admin(
      email: default_email,
      password: "password123"
    )
    puts "Created default admin agent: #{default_email} (password: password123)"
  end
end
