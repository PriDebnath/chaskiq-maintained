module ChaskiqBoot

  def self.plugin_autoloader
    begin
      if Chaskiq::Config.get("DISABLE_AUTOLOAD_APPSTORE") != "true"
        puts "🌱🌱🌱 LOADING CHASKIQ PLUGINS 🌱🌱🌱"
        # Only load plugins if database is ready and table exists
        if ActiveRecord::Base.connection.table_exists?('plugins')
          Plugin.save_all_plugins 
        else
          puts "⚠️  Plugins table not found, skipping plugin loading"
        end
      else
        puts "❗ CHASKIQ PLUGINS LOADING IS DISABLED ❗"
      end
      rescue => e
        puts "🔴 ERROR saving plugins #{e.message}"
        puts e.backtrace.first(5).join("\n") if Rails.env.development?
    end
    puts ascii()
    puts "🔥 Visit https://appstore.chaskiq.io for a comprehensive plugin list for your Chaskiq instance 🔥"
  end

  def self.ascii()

    <<~VIEW
    ________               __   _      
    / ____/ /_  ____ ______/ /__(_)___ _
   / /   / __ \/ __ `/ ___/ //_/ / __ `/
  / /___/ / / / /_/ (__  ) ,< / / /_/ / 
  \____/_/ /_/\__,_/____/_/|_/_/\__, /  
                                  /_/   
    VIEW


  end
end