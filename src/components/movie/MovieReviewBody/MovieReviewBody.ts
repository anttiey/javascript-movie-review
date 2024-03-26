import Component from '../../common/Component/Component';
import MovieList from '../MovieList/MovieList';
import MovieListCardSkeleton from '../MovieListCardSkeleton/MovieListCardSkeleton';
import MovieDetailModal from '../MovieDetailModal/MovieDetailModal';
import Movie from '../../../domain/Movie/Movie';
import { createElement } from '../../../utils/dom/createElement/createElement';
import { querySelector } from '../../../utils/dom/selector';
import { MOVIE, MOVIE_ITEM_SKELETON } from '../../../constants/Condition';
import { ELEMENT_SELECTOR } from '../../../constants/Selector';
import { NoResultImage } from '../../../assets';
import MovieAPI from '../../../apis/movie/movie';
import './MovieReviewBody.css';

interface MovieReviewBodyProps {
  movieType: string;
}

class MovieReviewBody extends Component<MovieReviewBodyProps> {
  private movie: Movie | undefined;

  protected initializeState(): void {
    this.movie = new Movie();
  }

  protected render() {
    this.$element.append(this.createComponent());
    this.updateMovieList();
  }

  protected createComponent() {
    const $section = createElement({
      tagName: 'section',
      attributeOptions: { id: 'movie-review-section', class: 'item-view' },
    });

    $section.innerHTML = /* html */ `
      <h2>${this.props?.movieType === 'popular' ? '지금 인기 있는 영화' : `"${this.props?.movieType}" 검색 결과`}</h2>
      <div id="movie-list-container" class="movie-list-container"></div>
      <button id="more-button" class="btn primary full-width">더보기</button>
    `;

    return $section;
  }

  private updateMovieList() {
    const $movieListContainer = querySelector<HTMLElement>('#movie-list-container', this.$element);
    const $ul = createElement({ tagName: 'ul', attributeOptions: { class: 'item-list' } });

    this.renderSkeletonList($movieListContainer, $ul);
    this.renderMovieList($movieListContainer, $ul);
  }

  private renderSkeletonList($movieListContainer: HTMLElement, $ul: HTMLElement) {
    Array.from({ length: MOVIE_ITEM_SKELETON.LENGTH }, () => new MovieListCardSkeleton($ul));
    $movieListContainer.append($ul);
  }

  private renderMovieList($movieListContainer: HTMLElement, $ul: HTMLElement) {
    if (!this.movie) return;

    this.movie.setPage(MOVIE.PAGE_UNIT);
    this.movie.fetchMovies({
      movieType: this.props?.movieType ?? '',
      onSuccess: (data) => {
        $ul.remove();

        if (data.results.length === 0) {
          this.renderNoResultImage($movieListContainer);
          return;
        }

        if (data.results.length < MOVIE.MAX_ITEM) this.removeMoreButton();

        new MovieList($movieListContainer, {
          movieItems: data.results,
          createMovieDetailModal: this.createMovieDetailModal.bind(this),
        });
      },
      onError: (error) => this.openErrorModal(error),
    });
  }

  private renderNoResultImage($movieListContainer: HTMLElement) {
    const $noResultImage = createElement({
      tagName: 'img',
      attributeOptions: { src: NoResultImage, alt: '검색 결과 없음 이미지', class: 'no-result-image' },
    });

    $movieListContainer.appendChild($noResultImage);

    this.removeMoreButton();
  }

  private removeMoreButton() {
    const $button = querySelector<HTMLButtonElement>(ELEMENT_SELECTOR.moreButton, this.$element);
    $button.remove();
  }

  private openErrorModal(error: unknown) {
    if (error instanceof Error) {
      const $modal = querySelector<HTMLDialogElement>(ELEMENT_SELECTOR.errorFallBackModal);
      $modal.showModal();
    }
  }

  private createMovieDetailModal(key: number) {
    const $movieReviewSection = querySelector<HTMLElement>('#movie-review-section');

    MovieAPI.fetchMovieDetail(key).then((data) => {
      new MovieDetailModal($movieReviewSection, { movieDetail: data });

      const $modal = querySelector<HTMLDialogElement>('#movie-detail-modal');
      $modal.showModal();
    });
  }

  protected setEvent(): void {
    const $moreButton = querySelector<HTMLButtonElement>(ELEMENT_SELECTOR.moreButton, this.$element);
    $moreButton.addEventListener('click', this.handleMoreButtonClick.bind(this));
  }

  private handleMoreButtonClick() {
    this.updateMovieList();

    if (this.movie && this.movie.isMaxPage()) {
      this.removeMoreButton();
    }
  }
}

export default MovieReviewBody;
