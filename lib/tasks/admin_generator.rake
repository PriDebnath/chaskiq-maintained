desc "Generates a default admin"
task admin_generator: :environment do
  # Ensure there is at least one App record, similar to db/seeds.rb
  domain = ENV["HOST"] || "http://localhost:3000"

  app = App.find_or_initialize_by(name: "test app")
  if app.new_record?
    app.domain_url = domain
    app.save!
  end

  # Use configured admin email/password when available, otherwise fall back
  email = Chaskiq::Config.get("ADMIN_EMAIL") || "admin@example.com"
  password = Chaskiq::Config.get("ADMIN_PASSWORD") || "password123"

  role = app.add_admin(
    email: email,
    password: password
  )
  
  agent = role.agent
  puts "✅ Admin created/updated successfully!"
  puts "   Email: #{agent.email}"
  puts "   Locked: #{agent.locked_at.present? ? 'YES (unlocking...)' : 'NO'}"
  puts "   Confirmed: #{agent.confirmed_at.present? ? 'YES' : 'NO'}"
  puts "   Failed attempts: #{agent.failed_attempts}"
  puts "   Password valid: #{agent.valid_password?(password) ? 'YES' : 'NO'}"
end
