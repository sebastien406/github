const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

const lireJson = (chemin) => {
  try {
    const donneesBrutes = fs.readFileSync(chemin, 'utf-8');
    return JSON.parse(donneesBrutes);
  } catch (erreur) {
    console.error(`Erreur lors de la lecture du fichier ${chemin}:`, erreur);
    return null; // Retourne null en cas d'erreur de lecture ou de parsing
  }
};

const ecrireJson = (chemin, donnees) => {
  try {
    fs.writeFileSync(chemin, JSON.stringify(donnees, null, 2));
  } catch (erreur) {
    console.error(`Erreur lors de l'écriture du fichier ${chemin}:`, erreur);
    throw erreur; // Re-lance l'erreur pour être capturée par le bloc try-catch de la route
  }
};

app.get('/', (req, res) => {
  res.send('Bienvenue sur l’API du mini-blog !');
});

// Routes pour les articles (posts)

// GET /articles - Liste tous les articles
app.get('/articles', (req, res, next) => {
  try {
    const articles = lireJson('./data/posts.json');
    if (articles) {
      res.json(articles);
    } else {
      const erreur = new Error('Impossible de récupérer les articles.');
      erreur.status = 500;
      next(erreur);
    }
  } catch (erreur) {
    next(erreur);
  }
});

// GET /articles/:id - Affiche un article
app.get('/articles/:id', (req, res, next) => {
  try {
    const identifiantArticle = parseInt(req.params.id);
    const articles = lireJson('./data/posts.json');
    if (!articles) {
      const erreur = new Error('Impossible de récupérer les articles.');
      erreur.status = 500;
      return next(erreur);
    }
    const article = articles.find(a => a.id === identifiantArticle);
    if (article) {
      res.json(article);
    } else {
      res.status(404).send('Article non trouvé.');
    }
  } catch (erreur) {
    next(erreur);
  }
});

// POST /articles - Crée un nouvel article
app.post('/articles', (req, res, next) => {
  try {
    const nouvelArticle = req.body;
    if (!nouvelArticle || !nouvelArticle.title || !nouvelArticle.content) {
      return res.status(400).send('Titre et contenu de l\'article sont requis.');
    }

    const articles = lireJson('./data/posts.json');
    if (!articles) {
      const erreur = new Error('Impossible de récupérer les articles pour l\'ajout.');
      erreur.status = 500;
      return next(erreur);
    }

    const nouvelId = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;
    nouvelArticle.id = nouvelId;
    articles.push(nouvelArticle);
    ecrireJson('./data/posts.json', articles);
    res.status(201).json(nouvelArticle);
  } catch (erreur) {
    next(erreur);
  }
});

// PATCH /articles/:id - Modifie un article existant
app.patch('/articles/:id', (req, res, next) => {
  try {
    const identifiantArticle = parseInt(req.params.id);
    const misesAJour = req.body;

    let articles = lireJson('./data/posts.json');
    if (!articles) {
      const erreur = new Error('Impossible de récupérer les articles pour la modification.');
      erreur.status = 500;
      return next(erreur);
    }

    const indexArticle = articles.findIndex(a => a.id === identifiantArticle);
    if (indexArticle !== -1) {
      articles[indexArticle] = { ...articles[indexArticle], ...misesAJour };
      ecrireJson('./data/posts.json', articles);
      res.json(articles[indexArticle]);
    } else {
      res.status(404).send('Article non trouvé.');
    }
  } catch (erreur) {
    next(erreur);
  }
});

// DELETE /articles/:id - Supprime un article
app.delete('/articles/:id', (req, res, next) => {
  try {
    const identifiantArticle = parseInt(req.params.id);
    let articles = lireJson('./data/posts.json');
    if (!articles) {
      const erreur = new Error('Impossible de récupérer les articles pour la suppression.');
      erreur.status = 500;
      return next(erreur);
    }

    const longueurAvantSuppression = articles.length;
    articles = articles.filter(a => a.id !== identifiantArticle);

    if (articles.length < longueurAvantSuppression) {
      ecrireJson('./data/posts.json', articles);
      res.status(204).send(); // No Content
    } else {
      res.status(404).send('Article non trouvé.');
    }
  } catch (erreur) {
    next(erreur);
  }
});

// Routes pour les commentaires (comments)

// GET /articles/:id/commentaires - Liste les commentaires d’un article
app.get('/articles/:id/commentaires', (req, res, next) => {
  try {
    const identifiantArticle = parseInt(req.params.id);
    const commentaires = lireJson('./data/comments.json');
    if (!commentaires) {
      const erreur = new Error('Impossible de récupérer les commentaires.');
      erreur.status = 500;
      return next(erreur);
    }
    const commentairesFiltres = commentaires.filter(c => c.postId === identifiantArticle);
    res.json(commentairesFiltres);
  } catch (erreur) {
    next(erreur);
  }
});

// POST /articles/:id/commentaires - Ajoute un commentaire
app.post('/articles/:id/commentaires', (req, res, next) => {
  try {
    const identifiantArticle = parseInt(req.params.id);
    const nouveauCommentaire = req.body;
    if (!nouveauCommentaire || !nouveauCommentaire.content || !nouveauCommentaire.author) {
      return res.status(400).send('Contenu et auteur du commentaire sont requis.');
    }

    const commentaires = lireJson('./data/comments.json');
    if (!commentaires) {
      const erreur = new Error('Impossible de récupérer les commentaires pour l\'ajout.');
      erreur.status = 500;
      return next(erreur);
    }

    const nouvelId = commentaires.length > 0 ? Math.max(...commentaires.map(c => c.id)) + 1 : 1;
    nouveauCommentaire.id = nouvelId;
    nouveauCommentaire.postId = identifiantArticle; // Associe le commentaire à l'article
    commentaires.push(nouveauCommentaire);
    ecrireJson('./data/comments.json', commentaires);
    res.status(201).json(nouveauCommentaire);
  } catch (erreur) {
    next(erreur);
  }
});

// DELETE /commentaires/:id - Supprime un commentaire
app.delete('/commentaires/:id', (req, res, next) => {
  try {
    const identifiantCommentaire = parseInt(req.params.id);
    let commentaires = lireJson('./data/comments.json');
    if (!commentaires) {
      const erreur = new Error('Impossible de récupérer les commentaires pour la suppression.');
      erreur.status = 500;
      return next(erreur);
    }

    const longueurAvantSuppression = commentaires.length;
    commentaires = commentaires.filter(c => c.id !== identifiantCommentaire);

    if (commentaires.length < longueurAvantSuppression) {
      ecrireJson('./data/comments.json', commentaires);
      res.status(204).send(); // No Content
    } else {
      res.status(404).send('Commentaire non trouvé.');
    }
  } catch (erreur) {
    next(erreur);
  }
});

// Middleware de gestion des erreurs
app.use((erreur, req, res, next) => {
  console.error(erreur.stack); // Log l'erreur pour le débogage
  res.status(erreur.status || 500).send(erreur.message || 'Une erreur est survenue !');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
  
});