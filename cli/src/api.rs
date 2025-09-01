use gi_core::Settings;

pub fn run_core(settings: &Settings) {
    //gi_core::analyze_repository(settings);

    println!("API received settings: {:?}",settings);
}

fn api() {
    println!("API module");
}