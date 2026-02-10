{ pkgs, ... }: {
  # Instala la version 20 de Node.js
  packages = [ pkgs.nodejs_20 ];

  idx = {
    # Instala extensiones utiles de VS Code
    extensions = [
      "dbaeumer.vscode-eslint" # Linter para Javascript
    ];

    # Comandos que se ejecutan al crear el workspace
    workspace = {
      # Se ejecuta solo la primera vez que se crea el entorno
      onCreate = {
        # Instala las dependencias de npm desde la carpeta 'backend'
        npm-install = "cd backend && npm install";
      };
    };

    # Configura la previsualizacion de la aplicacion web
    previews = {
      enable = true;
      previews = {
        web = {
          # Ejecuta el servidor de desarrollo desde la carpeta 'backend'
          command = ["sh", "-c", "cd backend && npm run dev -- --port $PORT"];
          manager = "web";
        };
      };
    };
  };
}
